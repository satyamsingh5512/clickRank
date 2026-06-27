"""
ClickRank — Offline Learning-to-Rank Training Pipeline
=======================================================
Trains a pairwise XGBRanker (objective='rank:ndcg') on a 4-dimensional
feature vector per candidate item:
  [0] ctr              — Click-Through Rate (0.0–1.0)
  [1] recency_hours    — Hours since item creation/update (0.0–∞)
  [2] segment_power    — Binary flag: 1.0 if user segment == 'power'
  [3] segment_new      — Binary flag: 1.0 if user segment == 'new'

The trained model is exported to the ONNX binary format at:
  models/ranker.onnx

Usage:
  pip install xgboost onnxmltools skl2onnx numpy scikit-learn
  python scripts/train_and_export.py

The resulting `models/ranker.onnx` is loaded at startup by the
FastAPI inference service (services/ml-ranking-service/main.py).
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize

import xgboost as xgb
import onnxmltools
from onnxmltools.convert import convert_xgboost
from onnxconverter_common.data_types import FloatTensorType

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("clickrank.training")

# ─── Paths ────────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = REPO_ROOT / "models"
MODEL_PATH = MODEL_DIR / "ranker.onnx"
FEATURE_NAMES = ["ctr", "recency_hours", "segment_power", "segment_new"]
N_FEATURES = len(FEATURE_NAMES)

# ─── Synthetic Dataset Generation ─────────────────────────────────────────────

def _generate_ranking_dataset(
    n_queries: int = 200,
    avg_docs_per_query: int = 30,
    random_seed: int = 42,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Generate a synthetic pairwise LTR dataset.

    Returns:
        X        — feature matrix  (N, 4)  float32
        y        — relevance labels (N,)    int32   [0, 1, 2, 3]
        groups   — docs-per-query  (n_queries,) int array for XGBRanker.fit()

    Feature generation heuristics
    ──────────────────────────────
    • Highly-relevant items (label=3) tend to have high CTR + low recency.
    • Relevant items (label=2) have moderate CTR.
    • Marginal items (label=1) have low CTR + high recency.
    • Irrelevant (label=0) have near-zero CTR + very high recency.

    This establishes a learnable signal for NDCG optimisation.
    """
    rng = np.random.default_rng(random_seed)
    X_list, y_list, groups = [], [], []

    label_profiles: dict[int, dict] = {
        3: {"ctr_mean": 0.35, "ctr_std": 0.08, "rec_mean": 4.0,   "rec_std": 2.0},
        2: {"ctr_mean": 0.18, "ctr_std": 0.06, "rec_mean": 18.0,  "rec_std": 6.0},
        1: {"ctr_mean": 0.07, "ctr_std": 0.04, "rec_mean": 60.0,  "rec_std": 20.0},
        0: {"ctr_mean": 0.02, "ctr_std": 0.02, "rec_mean": 200.0, "rec_std": 50.0},
    }

    for _ in range(n_queries):
        n_docs = rng.integers(
            max(4, avg_docs_per_query - 10),
            avg_docs_per_query + 10,
        )
        groups.append(int(n_docs))

        # Distribute labels across docs in this query group
        label_counts = rng.multinomial(n_docs, [0.08, 0.22, 0.35, 0.35])
        labels_for_query: list[int] = []
        for lbl, cnt in enumerate(label_counts):
            labels_for_query.extend([lbl] * int(cnt))
        rng.shuffle(labels_for_query)

        for lbl in labels_for_query:
            prof = label_profiles[lbl]

            ctr = float(
                np.clip(rng.normal(prof["ctr_mean"], prof["ctr_std"]), 0.0, 1.0)
            )
            recency = float(
                np.clip(rng.normal(prof["rec_mean"], prof["rec_std"]), 0.0, None)
            )
            seg_power = float(rng.choice([0.0, 1.0], p=[0.75, 0.25]))
            seg_new   = float(rng.choice([0.0, 1.0], p=[0.80, 0.20]))

            X_list.append([ctr, recency, seg_power, seg_new])
            y_list.append(lbl)

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int32)
    groups_arr = np.array(groups, dtype=np.int32)

    logger.info(
        "Dataset: %d docs across %d queries  (features=%s)",
        len(X), n_queries, FEATURE_NAMES,
    )
    return X, y, groups_arr


# ─── Model Training ───────────────────────────────────────────────────────────

def train_ranker(
    X: np.ndarray,
    y: np.ndarray,
    groups: np.ndarray,
) -> xgb.XGBRanker:
    """
    Train a pairwise XGBRanker targeting NDCG optimisation.

    Hyper-parameters are tuned for a low-latency inference target:
    • n_estimators=150  — lightweight ensemble for sub-10ms ONNX inference
    • max_depth=6       — enough capacity to model CTR × recency interactions
    • learning_rate=0.1 — standard shrinkage
    • subsample=0.8     — prevents overfitting on synthetic data
    • colsample_bytree=1.0 — use all 4 features every tree
    """
    # 80/20 query-level train/val split to monitor ranking quality
    n_train_queries = int(len(groups) * 0.8)
    train_end = int(groups[:n_train_queries].sum())

    X_train, y_train, g_train = X[:train_end], y[:train_end], groups[:n_train_queries]
    X_val,   y_val,   g_val   = X[train_end:], y[train_end:], groups[n_train_queries:]

    ranker = xgb.XGBRanker(
        objective="rank:ndcg",
        n_estimators=150,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=1.0,
        tree_method="hist",       # CPU-optimised histogram method
        device="cpu",
        n_jobs=-1,
        eval_metric=["ndcg@10"],
        verbosity=1,
        early_stopping_rounds=20,
    )

    logger.info("Training XGBRanker (objective='rank:ndcg')...")
    ranker.fit(
        X_train, y_train,
        group=g_train,
        eval_set=[(X_val, y_val)],
        eval_group=[g_val],
        verbose=False,
    )

    best_ndcg = ranker.best_score
    logger.info("Training complete — best val NDCG@10: %.4f", best_ndcg)
    return ranker


# ─── ONNX Export ──────────────────────────────────────────────────────────────

def export_onnx(ranker: xgb.XGBRanker, output_path: Path) -> None:
    """
    Export the trained XGBRanker to ONNX format using onnxmltools.

    The resulting graph accepts float32 input of shape [batch, 4] and outputs
    a float32 score array of shape [batch]. The ONNX Runtime inference service
    reads these scores to sort candidate items descending by relevance.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    initial_types = [("float_input", FloatTensorType([None, N_FEATURES]))]

    logger.info("Converting XGBRanker to ONNX (opset 15)...")
    onnx_model = convert_xgboost(
        ranker,
        initial_types=initial_types,
        target_opset=15,
    )

    onnxmltools.utils.save_model(onnx_model, str(output_path))
    file_size_kb = output_path.stat().st_size / 1024
    logger.info(
        "ONNX model saved → %s  (%.1f KB)",
        output_path.relative_to(REPO_ROOT),
        file_size_kb,
    )


# ─── Validation: Quick Sanity Check ───────────────────────────────────────────

def validate_onnx(model_path: Path) -> None:
    """
    Load the exported ONNX model with ONNX Runtime and run a single batch
    to confirm the graph is well-formed before committing it to the registry.
    """
    try:
        import onnxruntime as rt  # noqa: PLC0415
    except ImportError:
        logger.warning("onnxruntime not installed — skipping ONNX validation.")
        return

    sess_opts = rt.SessionOptions()
    sess_opts.intra_op_num_threads = 2
    sess_opts.inter_op_num_threads = 2

    sess = rt.InferenceSession(
        str(model_path),
        sess_options=sess_opts,
        providers=["CPUExecutionProvider"],
    )

    input_name = sess.get_inputs()[0].name
    dummy = np.array(
        [[0.25, 5.0, 1.0, 0.0],
         [0.08, 48.0, 0.0, 1.0],
         [0.45, 1.0, 0.0, 0.0]],
        dtype=np.float32,
    )
    scores = sess.run(None, {input_name: dummy})[0]
    logger.info(
        "ONNX validation passed — dummy scores: %s",
        [f"{s:.4f}" for s in scores.ravel()],
    )


# ─── Entry Point ──────────────────────────────────────────────────────────────

def main() -> None:
    logger.info("=== ClickRank LTR Training Pipeline ===")
    logger.info("Feature vector: %s", FEATURE_NAMES)

    X, y, groups = _generate_ranking_dataset(n_queries=200, avg_docs_per_query=30)
    ranker = train_ranker(X, y, groups)
    export_onnx(ranker, MODEL_PATH)
    validate_onnx(MODEL_PATH)

    logger.info("=== Pipeline complete. Artifact: %s ===", MODEL_PATH)


if __name__ == "__main__":
    main()
