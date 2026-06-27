#!/usr/bin/env python3
"""
ClickRank — Redis Feature Store Seeder
=======================================
Pre-populates the Redis feature store with synthetic but realistic feature
vectors for 1,000 items so the system does not hit cold-start cache misses
during the first load test run.

Feature key schema:
  Key:   features:item:{itemId}
  Value: "ctr,recency_hours,segment_power,segment_new"
  TTL:   7 days

Also seeds the trending ZSet (trending:queries) with sample query scores
so the MlRankingClient circuit-breaker fallback has data to return.

Usage:
  # Against docker-compose single node (host port 6380 mapped to 6379 inside):
  python scripts/seed_redis_features.py --host localhost --port 6380

  # Against production Redis (auth required):
  python scripts/seed_redis_features.py --host <host> --port 6379 --password <pwd>

  # Dry-run (print keys without writing):
  python scripts/seed_redis_features.py --dry-run
"""

from __future__ import annotations

import argparse
import logging
import random
import sys
import time
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("clickrank.seeder")


# ─── Config ───────────────────────────────────────────────────────────────────

ITEM_COUNT     = 1_000
FEATURE_TTL    = 7 * 24 * 3600   # 7 days in seconds
TRENDING_TTL   = 24 * 3600       # 1 day

SAMPLE_QUERIES = [
    "iphone", "laptop", "headphones", "shoes", "keyboard",
    "monitor", "camera", "tablet", "smartwatch", "gaming-chair",
]

# Realistic CTR distribution for seeding:
#   ~5%  of items are "hot"   (CTR 25-45%)
#   ~20% are "warm"           (CTR 10-25%)
#   ~75% are "cold"           (CTR 1-10%)
CTR_PROFILES = [
    (0.05, (0.25, 0.45)),   # hot
    (0.20, (0.10, 0.25)),   # warm
    (0.75, (0.01, 0.10)),   # cold
]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _random_ctr(rng: random.Random) -> float:
    """Pick a CTR from a realistic multi-modal distribution."""
    roll = rng.random()
    cumulative = 0.0
    for weight, (lo, hi) in CTR_PROFILES:
        cumulative += weight
        if roll <= cumulative:
            return round(rng.uniform(lo, hi), 6)
    return round(rng.uniform(0.01, 0.10), 6)


def _random_recency(rng: random.Random) -> float:
    """Hours since creation — exponential distribution skewed to recent."""
    # Most items are recent (< 72h), long tail to 720h (30 days)
    hours = min(720.0, rng.expovariate(1 / 36.0))   # mean=36h
    return round(hours, 4)


def seed(
    host: str,
    port: int,
    password: Optional[str],
    db: int,
    dry_run: bool,
    batch_size: int = 100,
) -> None:
    """Connect to Redis and write feature + trending data."""

    if not dry_run:
        try:
            import redis  # noqa: PLC0415
        except ImportError:
            logger.error(
                "Package 'redis' not found. Install with: pip install redis>=5.0"
            )
            sys.exit(1)

        client = redis.Redis(
            host=host,
            port=port,
            password=password or None,
            db=db,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        try:
            client.ping()
            logger.info("Connected to Redis at %s:%d", host, port)
        except Exception as exc:
            logger.error("Cannot connect to Redis: %s", exc)
            sys.exit(1)
    else:
        client = None
        logger.info("[DRY-RUN] Would connect to Redis at %s:%d", host, port)

    rng = random.Random(42)   # deterministic seed for reproducibility
    pipe = client.pipeline(transaction=False) if client else None

    item_ids: list[str] = []

    # ── 1. Seed feature vectors ─────────────────────────────────────────────
    logger.info("Seeding %d item feature vectors ...", ITEM_COUNT)
    total_written = 0

    for i in range(1, ITEM_COUNT + 1):
        item_id = f"item-{i:04d}"
        item_ids.append(item_id)

        ctr           = _random_ctr(rng)
        recency       = _random_recency(rng)
        seg_power     = 1.0 if rng.random() < 0.15 else 0.0   # 15% power users
        seg_new       = 1.0 if rng.random() < 0.25 else 0.0   # 25% new users

        feature_value = f"{ctr},{recency},{seg_power:.1f},{seg_new:.1f}"
        key           = f"features:item:{item_id}"

        if dry_run:
            if i <= 5:  # print first few in dry-run for inspection
                logger.info("[DRY-RUN] SET %s = %s  (TTL=%ds)", key, feature_value, FEATURE_TTL)
            continue

        pipe.setex(key, FEATURE_TTL, feature_value)

        if i % batch_size == 0:
            pipe.execute()
            total_written += batch_size
            logger.info("  Written %d / %d items ...", total_written, ITEM_COUNT)

    if client and ITEM_COUNT % batch_size != 0:
        pipe.execute()
        total_written += ITEM_COUNT % batch_size

    if not dry_run:
        logger.info("Feature store seeded: %d items written.", total_written)

    # ── 2. Seed also the seeder's "result-*" id range used by k6 ────────────
    # The k6 load test sends click events for result-0 through result-999.
    # Ensure those IDs also have feature data.
    logger.info("Seeding k6 result-* ID range (0-999) ...")
    pipe2 = client.pipeline(transaction=False) if client else None

    for i in range(1000):
        result_id     = f"result-{i}"
        ctr           = _random_ctr(rng)
        recency       = _random_recency(rng)
        feature_value = f"{ctr},{recency},0.0,0.0"
        key           = f"features:item:{result_id}"

        if dry_run:
            continue

        pipe2.setex(key, FEATURE_TTL, feature_value)

        if i % batch_size == 0 and i > 0:
            pipe2.execute()

    if client:
        pipe2.execute()
        logger.info("k6 result-* range seeded.")

    # ── 3. Seed trending ZSet ───────────────────────────────────────────────
    logger.info("Seeding trending:queries ZSet ...")

    # Also seed query-specific ZSets so L1 cache-hit path works
    seed_results_per_query = 10

    for query in SAMPLE_QUERIES:
        trending_score = rng.uniform(50, 500)

        if not dry_run:
            # Global trending ZSet
            client.zadd("trending:queries", {query: trending_score})
            client.expire("trending:queries", TRENDING_TTL)

            # Per-query ZSet (populated by RankingEngine on click events)
            # Seed with a few item IDs so the L1 cache-hit path is exercised
            zset_key = f"rankings:query:{query.lower()}"
            query_items = rng.sample(item_ids, min(seed_results_per_query, len(item_ids)))
            for rank, qitem in enumerate(query_items):
                score = seed_results_per_query - rank + rng.uniform(0, 1)
                client.zadd(zset_key, {qitem: score})
            client.expire(zset_key, TRENDING_TTL)
        else:
            logger.info("[DRY-RUN] ZADD trending:queries %s %.1f", query, trending_score)

    if not dry_run:
        logger.info(
            "Trending ZSet seeded with %d queries. Per-query ZSets pre-warmed.",
            len(SAMPLE_QUERIES),
        )

    # ── 4. Summary ────────────────────────────────────────────────────────────
    if dry_run:
        logger.info("[DRY-RUN] Complete — no data written.")
    else:
        total_keys = client.dbsize()
        logger.info(
            "Seeding complete. Redis now holds %d keys total. "
            "System is ready for load testing.",
            total_keys,
        )


# ─── CLI Entry Point ─────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed ClickRank Redis feature store for load testing."
    )
    parser.add_argument("--host",       default="localhost",  help="Redis host (default: localhost)")
    parser.add_argument("--port",       type=int, default=6380, help="Redis host port (default: 6380 for docker-compose)")
    parser.add_argument("--password",   default=None,         help="Redis password (optional)")
    parser.add_argument("--db",         type=int, default=0,  help="Redis DB index (default: 0)")
    parser.add_argument("--dry-run",    action="store_true",  help="Print keys without writing to Redis")
    parser.add_argument("--batch-size", type=int, default=100, help="Pipeline batch size (default: 100)")
    args = parser.parse_args()

    t_start = time.monotonic()
    seed(
        host=args.host,
        port=args.port,
        password=args.password,
        db=args.db,
        dry_run=args.dry_run,
        batch_size=args.batch_size,
    )
    elapsed = time.monotonic() - t_start
    logger.info("Total time: %.2fs", elapsed)


if __name__ == "__main__":
    main()
