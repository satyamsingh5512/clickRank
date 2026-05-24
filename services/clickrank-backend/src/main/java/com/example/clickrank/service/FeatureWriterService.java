package com.example.clickrank.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * FeatureWriterService — Keeps the Redis Feature Store up to date.
 *
 * <h3>Purpose</h3>
 * {@link MlRankingClient#rankCandidates} performs a pipelined MGET of
 * {@code features:item:{id}} keys before every ML inference call.
 * This service is responsible for writing (and updating) those keys
 * whenever a click event is processed.
 *
 * <h3>Feature Key Schema</h3>
 * <pre>
 *   Key:   features:item:{itemId}
 *   Value: "ctr,recency_hours,segment_power,segment_new"
 *   TTL:   7 days  (auto-expires stale items; re-written on each click)
 * </pre>
 *
 * <h3>CTR Update Strategy</h3>
 * We use exponential moving average (EMA) with α=0.15 to smooth
 * the CTR signal, preventing a single burst of clicks from over-inflating
 * an item's score while still reflecting recent popularity trends.
 *
 * <pre>
 *   new_ctr = α * 1.0 + (1 - α) * old_ctr
 *           = 0.15 + 0.85 * old_ctr    (on a click)
 * </pre>
 *
 * @see MlRankingClient#batchFetchFeatures
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FeatureWriterService {

    private static final String FEATURE_KEY_PREFIX = "features:item:";
    private static final Duration FEATURE_TTL       = Duration.ofDays(7);
    private static final double   EMA_ALPHA          = 0.15;

    // Reasonable cold-start defaults (match MlRankingClient.coldStartFeatures)
    private static final double DEFAULT_CTR           = 0.01;
    private static final double DEFAULT_RECENCY_HOURS = 720.0;  // 30 days
    private static final double DEFAULT_SEG_POWER     = 0.0;
    private static final double DEFAULT_SEG_NEW       = 0.0;

    private final StringRedisTemplate stringRedisTemplate;

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Record a click event for an item and update its Redis feature vector.
     * <p>
     * This method is called by {@link ClickEventConsumer} after successfully
     * persisting a click to the database and updating the ranking ZSet.
     * <p>
     * Thread-safe: Redis SET is atomic; concurrent calls for the same itemId
     * converge via the EMA formula without requiring distributed locking.
     *
     * @param itemId        the clicked item's identifier
     * @param createdAt     the item's creation/update time (used for recency_hours)
     * @param userSegment   the clicking user's segment ('power', 'new', 'returning', 'default')
     */
    public void recordClick(String itemId, Instant createdAt, String userSegment) {
        String key = FEATURE_KEY_PREFIX + itemId;

        // 1. Read existing feature string (may be null for first click)
        double[] existing = readExistingFeatures(key, itemId);

        // 2. Compute updated features
        double newCtr           = computeEmaCtr(existing[0]);
        double recencyHours     = computeRecencyHours(createdAt);
        double segPower         = "power".equalsIgnoreCase(userSegment) ? 1.0 : existing[2];
        double segNew           = "new".equalsIgnoreCase(userSegment)   ? 1.0 : existing[3];

        // 3. Write back as compact CSV string
        String featureValue = String.format("%.6f,%.4f,%.1f,%.1f",
                newCtr, recencyHours, segPower, segNew);

        stringRedisTemplate.opsForValue().set(key, featureValue, FEATURE_TTL);

        log.debug("Updated feature store: item={} features={}", itemId, featureValue);
    }

    /**
     * Upsert feature vector for an item without incrementing CTR.
     * Used during data seeding or batch feature backfills.
     *
     * @param itemId      item identifier
     * @param ctr         known click-through rate
     * @param createdAt   item creation time for recency calculation
     */
    public void upsertFeatures(String itemId, double ctr, Instant createdAt) {
        String key = FEATURE_KEY_PREFIX + itemId;
        double recencyHours = computeRecencyHours(createdAt);
        String featureValue = String.format("%.6f,%.4f,%.1f,%.1f",
                Math.min(1.0, Math.max(0.0, ctr)), recencyHours, DEFAULT_SEG_POWER, DEFAULT_SEG_NEW);
        stringRedisTemplate.opsForValue().set(key, featureValue, FEATURE_TTL);
        log.debug("Upserted features for item={}: {}", itemId, featureValue);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private double[] readExistingFeatures(String key, String itemId) {
        String raw = stringRedisTemplate.opsForValue().get(key);
        if (raw == null) {
            return new double[]{DEFAULT_CTR, DEFAULT_RECENCY_HOURS, DEFAULT_SEG_POWER, DEFAULT_SEG_NEW};
        }
        String[] parts = raw.split(",", -1);
        double[] f = {DEFAULT_CTR, DEFAULT_RECENCY_HOURS, DEFAULT_SEG_POWER, DEFAULT_SEG_NEW};
        try {
            if (parts.length > 0) f[0] = Double.parseDouble(parts[0].trim());
            if (parts.length > 1) f[1] = Double.parseDouble(parts[1].trim());
            if (parts.length > 2) f[2] = Double.parseDouble(parts[2].trim());
            if (parts.length > 3) f[3] = Double.parseDouble(parts[3].trim());
        } catch (NumberFormatException e) {
            log.warn("Malformed feature string for item={}: '{}' — using defaults", itemId, raw);
        }
        return f;
    }

    /**
     * Exponential Moving Average CTR update on click.
     * Clamps to [0, 1].
     */
    private double computeEmaCtr(double oldCtr) {
        double updated = EMA_ALPHA * 1.0 + (1.0 - EMA_ALPHA) * oldCtr;
        return Math.min(1.0, Math.max(0.0, updated));
    }

    /**
     * Hours elapsed since item creation. Negative values are clamped to 0.
     */
    private double computeRecencyHours(Instant createdAt) {
        if (createdAt == null) return DEFAULT_RECENCY_HOURS;
        long seconds = Instant.now().getEpochSecond() - createdAt.getEpochSecond();
        return Math.max(0.0, seconds / 3600.0);
    }
}
