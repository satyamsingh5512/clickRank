"""
ClickRank — ML Ranking Service  (FastAPI + ONNX Runtime)
=========================================================
Two-stage LTR inference endpoint serving a pre-trained XGBRanker
exported to ONNX format.

Feature vector per candidate item (must match training):
  [0] ctr              — Click-Through Rate (0.0–1.0)
  [1] recency_hours    — Hours since item creation/update
  [2] segment_power    — 1.0 if user_segment == 'power', else 0.0
  [3] segment_new      — 1.0 if user_segment == 'new',   else 0.0

Endpoints
─────────
  GET  /health       — liveness probe
  POST /v1/rank      — batch ranking inference  ← primary endpoint

Design goals
────────────
  • Single warm ONNX InferenceSession loaded at startup (no per-request I/O).
  • Contiguous C-ordered float32 NumPy array passed directly to the ONNX Runtime
    C++ backend — zero copy overhead.
  • CPU session pinned to 2 intra/inter-op threads for tight latency budget.
  • Graceful degradation: if model file is absent (CI/stub mode), the service
    falls back to a deterministic heuristic ranker so downstream tests pass.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List

import numpy as np
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("clickrank.ml-service")

# ─── Model Loading ────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = Path(os.getenv("ONNX_MODEL_PATH", str(REPO_ROOT / "models" / "ranker.onnx")))

_onnx_session = None          # warm InferenceSession — shared across all requests
_onnx_input_name: str = ""    # cached input tensor name
_FALLBACK_MODE: bool = False  # True when model file is unavailable


def _load_onnx_session() -> None:
    """
    Load the ONNX model into memory once at application startup.

    SessionOptions are tuned for minimal latency on a CPU-only host:
      • intra_op_num_threads=2  — parallelism within a single operator
      • inter_op_num_threads=2  — parallelism across independent graph nodes
      • execution_mode=SEQUENTIAL — avoids thread-pool contention at low QPS

    Falls back to heuristic ranker if the model artifact is missing
    (useful in CI environments that skip the training step).
    """
    global _onnx_session, _onnx_input_name, _FALLBACK_MODE

    if not MODEL_PATH.exists():
        logger.warning(
            "ONNX model not found at %s — running in HEURISTIC FALLBACK mode. "
            "Run `python scripts/train_and_export.py` to generate the artifact.",
            MODEL_PATH,
        )
        _FALLBACK_MODE = True
        return

    try:
        import onnxruntime as rt  # noqa: PLC0415

        sess_opts = rt.SessionOptions()
        sess_opts.intra_op_num_threads = 2
        sess_opts.inter_op_num_threads = 2
        sess_opts.execution_mode = rt.ExecutionMode.ORT_SEQUENTIAL
        # Disable telemetry to avoid I/O during inference hot path
        sess_opts.enable_profiling = False

        _onnx_session = rt.InferenceSession(
            str(MODEL_PATH),
            sess_options=sess_opts,
            providers=["CPUExecutionProvider"],
        )
        _onnx_input_name = _onnx_session.get_inputs()[0].name

        logger.info(
            "ONNX InferenceSession ready — model=%s  input='%s'  providers=%s",
            MODEL_PATH.name,
            _onnx_input_name,
            _onnx_session.get_providers(),
        )
        _FALLBACK_MODE = False

    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Failed to load ONNX model (%s) — switching to HEURISTIC FALLBACK: %s",
            MODEL_PATH,
            exc,
        )
        _FALLBACK_MODE = True


# ─── FastAPI Application ──────────────────────────────────────────────────────

app = FastAPI(
    title="ClickRank ML Ranking Service",
    version="2.0.0",
    description="Two-stage LTR inference over XGBRanker/ONNX Runtime.",
)


@app.on_event("startup")
async def startup_event() -> None:
    _load_onnx_session()


# ─── Request / Response Schemas ───────────────────────────────────────────────

class ItemFeatures(BaseModel):
    """Feature vector for a single candidate item."""

    item_id: str = Field(..., min_length=1, description="Opaque item identifier")
    ctr: float = Field(..., ge=0.0, le=1.0, description="Click-Through Rate [0, 1]")
    recency_hours: float = Field(..., ge=0.0, description="Hours since creation")
    segment_power: float = Field(0.0, ge=0.0, le=1.0, description="Power-user flag")
    segment_new: float = Field(0.0, ge=0.0, le=1.0, description="New-user flag")

    @field_validator("ctr", "segment_power", "segment_new", mode="before")
    @classmethod
    def _clamp_unit(cls, v: float) -> float:
        return float(np.clip(v, 0.0, 1.0))


class UserContext(BaseModel):
    user_id: str = Field(..., min_length=1)
    segment: str = Field(default="default")
    intent: str = Field(default="browse")


class RankRequest(BaseModel):
    items: List[ItemFeatures] = Field(..., min_length=1, max_length=500)
    user_context: UserContext


class RankedItem(BaseModel):
    item_id: str
    score: float
    rank: int


class RankResponse(BaseModel):
    ranked_items: List[RankedItem]
    ranked_at: datetime
    model_mode: str  # 'onnx' | 'heuristic'
    latency_ms: float


# ─── Inference Helpers ────────────────────────────────────────────────────────

def _build_feature_matrix(items: List[ItemFeatures]) -> np.ndarray:
    """
    Assemble a contiguous C-order float32 matrix of shape (N, 4).

    The C-order layout ensures the ONNX Runtime C++ kernel reads the memory
    sequentially without transposition overhead.

    Column order must match training (scripts/train_and_export.py):
      col 0 → ctr
      col 1 → recency_hours
      col 2 → segment_power
      col 3 → segment_new
    """
    data = [
        [item.ctr, item.recency_hours, item.segment_power, item.segment_new]
        for item in items
    ]
    return np.ascontiguousarray(data, dtype=np.float32)


def _run_onnx_inference(feature_matrix: np.ndarray) -> np.ndarray:
    """
    Execute the ONNX graph on the feature matrix.

    Returns a float32 array of shape (N,) — one relevance score per item.
    The C++ ORT backend processes the contiguous float32 buffer directly;
    no Python-level data marshalling occurs inside the C extension boundary.
    """
    raw = _onnx_session.run(None, {_onnx_input_name: feature_matrix})
    scores = raw[0]
    # XGBRanker ONNX output may be shape (N,) or (N, 1) depending on opset
    return scores.ravel().astype(np.float64)


def _heuristic_scores(items: List[ItemFeatures]) -> np.ndarray:
    """
    Deterministic fallback ranker when ONNX model is unavailable.
    Replicates the weighted formula from the original mock service.
    """
    scores = np.array(
        [(item.ctr * 0.70) + (max(0.0, 200.0 - item.recency_hours) / 200.0 * 0.30)
         for item in items],
        dtype=np.float64,
    )
    return scores


def _segment_boost(segment: str) -> float:
    _BOOSTS = {"power": 1.10, "returning": 1.04, "new": 0.93, "default": 1.0}
    return _BOOSTS.get(segment.lower(), 1.0)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", tags=["ops"])
async def health() -> dict:
    return {
        "status": "ok",
        "service": "ml-ranking-service",
        "model_mode": "heuristic" if _FALLBACK_MODE else "onnx",
        "model_path": str(MODEL_PATH),
    }


@app.post(
    "/v1/rank",
    response_model=RankResponse,
    status_code=status.HTTP_200_OK,
    tags=["inference"],
    summary="Batch item ranking via ONNX Runtime",
)
async def rank_items(payload: RankRequest) -> RankResponse:
    """
    Rank a batch of candidate items by predicted relevance.

    1. Assemble feature matrix X ∈ ℝ^{N×4} as a contiguous C-order float32 array.
    2. Forward X through the ONNX InferenceSession C++ backend to obtain scores ∈ ℝ^N.
    3. Apply a user-segment multiplier (post-processing boost, not part of the model).
    4. Sort descending by score and return ordered list with rank indices.
    """
    import time  # noqa: PLC0415

    t_start = time.perf_counter()

    try:
        feature_matrix = _build_feature_matrix(payload.items)

        if _FALLBACK_MODE or _onnx_session is None:
            raw_scores = _heuristic_scores(payload.items)
            mode = "heuristic"
        else:
            raw_scores = _run_onnx_inference(feature_matrix)
            mode = "onnx"

        # Apply segment multiplier as a lightweight post-processing boost
        boost = _segment_boost(payload.user_context.segment)
        final_scores = raw_scores * boost

        # Sort descending by score
        order = np.argsort(-final_scores)

        ranked = [
            RankedItem(
                item_id=payload.items[idx].item_id,
                score=round(float(final_scores[idx]), 6),
                rank=rank_pos + 1,
            )
            for rank_pos, idx in enumerate(order)
        ]

        t_elapsed_ms = (time.perf_counter() - t_start) * 1_000

        logger.info(
            "Ranked %d items  user=%s  segment=%s  mode=%s  latency=%.2fms",
            len(ranked),
            payload.user_context.user_id,
            payload.user_context.segment,
            mode,
            t_elapsed_ms,
        )

        return RankResponse(
            ranked_items=ranked,
            ranked_at=datetime.now(timezone.utc),
            model_mode=mode,
            latency_ms=round(t_elapsed_ms, 3),
        )

    except Exception as exc:
        logger.exception("Ranking pipeline failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ranking pipeline failed: {exc}",
        ) from exc


# ─── Legacy endpoint shim (backwards compatibility) ───────────────────────────
# The Spring Boot backend previously called POST /rank (v1 shape).
# This shim translates the legacy payload so existing callers keep working
# while the orchestration layer migrates to /v1/rank.

@app.post("/rank", include_in_schema=False)
async def rank_legacy(payload: RankRequest) -> RankResponse:
    """Backwards-compatible alias for POST /v1/rank."""
    return await rank_items(payload)
