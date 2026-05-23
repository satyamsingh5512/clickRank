package com.example.clickrank.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MlRankingClient — Production Two-Stage LTR Orchestrator
 * =========================================================
 *
 * <h3>Request Flow</h3>
 * <pre>
 *  Search Query
 *      │
 *      ▼
 *  ① Batch Redis MGET  ── features:item:{id}  (single network round-trip)
 *      │
 *      ▼
 *  ② Assemble feature matrix, POST to Python FastAPI /v1/rank
 *      │  (Resilience4j @CircuitBreaker guards this call)
 *      │
 *      ├─► [OPEN / FALLBACK] ──► fallbackRanking() reads Redis ZSet cache:global:trending
 *      │
 *      └─► [CLOSED] ──► parse ONNX scores, sort descending, return ranked IDs
 * </pre>
 *
 * <h3>Feature Key Schema</h3>
 * {@code features:item:{itemId}} → Comma-separated string: "ctr,recency_hours,segment_power,segment_new"
 * e.g. {@code "0.21,6.5,1.0,0.0"}
 *
 * <h3>Circuit Breaker Config</h3>
 * See {@code resilience4j.circuitbreaker.instances.mlRankingService} in application.yml.
 * Slow calls (>25ms) and 5xx responses both increment the failure counter.
 */
@Slf4j
@Service
public class MlRankingClient {

    // ── Redis feature key prefix ───────────────────────────────────────────────
    private static final String FEATURE_KEY_PREFIX = "features:item:";
    private static final String GLOBAL_TRENDING_KEY = "trending:queries";  // matches RedisKeyUtils.trendingKey()

    // ── Feature vector dimension & column order (must match Python training) ───
    private static final int FEATURE_DIM = 4;  // [ctr, recency_hours, seg_power, seg_new]
    private static final double DEFAULT_CTR = 0.01;
    private static final double DEFAULT_RECENCY = 720.0; // 30 days — cold-start penalty
    private static final double DEFAULT_SEG_POWER = 0.0;
    private static final double DEFAULT_SEG_NEW = 0.0;

    private final WebClient mlWebClient;
    private final StringRedisTemplate stringRedisTemplate;  // plain-text MGET for features
    private final RedisTemplate<String, Object> redisTemplate; // ZSet for fallback
    private final Counter circuitBreakerFallbackCounter;
    private final Timer mlLatencyTimer;

    @Value("${ml.ranking.top-n:10}")
    private int topN;

    public MlRankingClient(
            WebClient mlWebClient,
            StringRedisTemplate stringRedisTemplate,
            RedisTemplate<String, Object> redisTemplate,
            MeterRegistry meterRegistry) {
        this.mlWebClient = mlWebClient;
        this.stringRedisTemplate = stringRedisTemplate;
        this.redisTemplate = redisTemplate;
        this.circuitBreakerFallbackCounter = meterRegistry.counter(
                "ml.circuit_breaker.fallback.total",
                "service", "mlRankingService"
        );
        this.mlLatencyTimer = meterRegistry.timer("ml.ranking.request.duration", "service", "mlRankingService");
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Orchestrate the full two-stage LTR pipeline for a list of candidate item IDs.
     * <p>
     * Stage 1: Batch-fetch features from Redis in a single pipelined MGET.
     * Stage 2: Forward assembled feature matrix to the ML service; circuit breaker
     *          guards against ML service unavailability.
     *
     * @param candidateIds ordered list of item ID strings to rank
     * @param userId       calling user identifier (for logging/telemetry)
     * @param segment      user segment ('power', 'new', 'returning', 'default')
     * @param intent       user intent ('browse', 'buy') — passed through to ML service
     * @return list of item IDs sorted descending by predicted relevance score
     */
    @CircuitBreaker(name = "mlRankingService", fallbackMethod = "executeFallbackRanking")
    public List<String> rankCandidates(
            List<String> candidateIds,
            String userId,
            String segment,
            String intent) {

        if (candidateIds == null || candidateIds.isEmpty()) {
            return Collections.emptyList();
        }

        Timer.Sample timerSample = Timer.start();

        // Stage 1 ── Batch Redis MGET feature lookup ──────────────────────────
        Map<String, double[]> featureMap = batchFetchFeatures(candidateIds);

        // Stage 2 ── Assemble ML request payload ──────────────────────────────
        List<Map<String, Object>> items = candidateIds.stream()
                .map(id -> {
                    double[] f = featureMap.getOrDefault(id, coldStartFeatures());
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("item_id", id);
                    item.put("ctr", f[0]);
                    item.put("recency_hours", f[1]);
                    item.put("segment_power", f[2]);
                    item.put("segment_new", f[3]);
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> userCtx = Map.of(
                "user_id", userId,
                "segment", segment,
                "intent", intent
        );

        Map<String, Object> requestBody = Map.of(
                "items", items,
                "user_context", userCtx
        );

        // Stage 3 ── POST to FastAPI /v1/rank ─────────────────────────────────
        @SuppressWarnings("unchecked")
        Map<String, Object> response = mlWebClient.post()
                .uri("/v1/rank")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(
                        status -> status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(new RuntimeException(
                                        "ML service returned 5xx: " + clientResponse.statusCode() + " — " + body
                                )))
                )
                .bodyToMono(Map.class)
                .timeout(Duration.ofMillis(500))  // hard timeout: circuit opens if exceeded
                .block();

        timerSample.stop(mlLatencyTimer);

        if (response == null || !response.containsKey("ranked_items")) {
            log.warn("ML service returned empty/malformed response — using original order");
            return candidateIds;
        }

        // Parse ranked_items → ordered ID list
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rankedItems = (List<Map<String, Object>>) response.get("ranked_items");

        List<String> result = rankedItems.stream()
                .map(ri -> (String) ri.get("item_id"))
                .collect(Collectors.toList());

        log.info("ML ranking complete — {} items ranked  user={} segment={} mode={}",
                result.size(), userId, segment, response.getOrDefault("model_mode", "unknown"));

        return result;
    }

    // ── Resilience4j Fallback ──────────────────────────────────────────────────

    /**
     * Fallback activated when the circuit is OPEN or the ML service call fails.
     * <p>
     * Reads the global trending ZSet ({@code cache:global:trending}) from Redis —
     * which is continuously updated by the {@link RankingEngine} on every click —
     * and returns the top-N item IDs ordered by popularity score.
     * <p>
     * This ensures zero degraded search quality from the user's perspective:
     * instead of returning random or empty results, they receive the platform's
     * most-clicked items as a safe, deterministic fallback.
     *
     * @param candidateIds original candidate list (available to fallback)
     * @param userId       original caller user ID
     * @param segment      original caller segment
     * @param intent       original caller intent
     * @param ex           the exception that tripped the circuit
     */
    @SuppressWarnings("unused")  // called reflectively by Resilience4j
    public List<String> executeFallbackRanking(
            List<String> candidateIds,
            String userId,
            String segment,
            String intent,
            Throwable ex) {

        circuitBreakerFallbackCounter.increment();
        log.warn(
                "[CIRCUIT-BREAKER OPEN] ML service unavailable — activating fallback ranking. " +
                "user={} reason={}", userId, ex.getMessage()
        );

        try {
            // Read top-N from global trending ZSet (populated by click events via RankingEngine)
            Set<ZSetOperations.TypedTuple<Object>> trending =
                    redisTemplate.opsForZSet()
                                 .reverseRangeWithScores(GLOBAL_TRENDING_KEY, 0, topN - 1);

            if (trending != null && !trending.isEmpty()) {
                List<String> trendingIds = trending.stream()
                        .map(t -> String.valueOf(t.getValue()))
                        .collect(Collectors.toList());
                log.info("[FALLBACK] Returning {} items from global trending ZSet", trendingIds.size());
                return trendingIds;
            }
        } catch (Exception redisEx) {
            log.error("[FALLBACK] Redis ZSet read also failed — returning original candidate order: {}",
                    redisEx.getMessage());
        }

        // Last-resort: return candidates in original order (no ranking degradation)
        return candidateIds;
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────

    /**
     * Batch-fetch item features from Redis using a pipelined MGET operation.
     * <p>
     * A single Redis round-trip retrieves all feature strings regardless of batch size.
     * Feature strings are stored as: {@code "ctr,recency_hours,segment_power,segment_new"}
     * <p>
     * Cold-start items (no Redis entry) receive safe default feature values that
     * place them at the bottom of the ranking without causing NullPointerExceptions.
     *
     * @param itemIds list of item identifiers to look up
     * @return map from itemId → double[4] feature vector
     */
    private Map<String, double[]> batchFetchFeatures(List<String> itemIds) {
        List<String> keys = itemIds.stream()
                .map(id -> FEATURE_KEY_PREFIX + id)
                .collect(Collectors.toList());

        // StringRedisTemplate.executePipelined — single TCP round-trip MGET
        // Returns plain strings without JSON type headers, compatible with
        // feature data written by the Python feature-store pipeline.
        List<Object> rawValues = stringRedisTemplate.executePipelined(connection -> {
            for (String key : keys) {
                connection.stringCommands().get(key.getBytes());
            }
            return null;  // required by pipelined() contract
        });

        Map<String, double[]> result = new HashMap<>(itemIds.size() * 2);
        for (int i = 0; i < itemIds.size(); i++) {
            String id = itemIds.get(i);
            Object raw = (rawValues != null && i < rawValues.size()) ? rawValues.get(i) : null;
            result.put(id, parseFeatureString(raw, id));
        }
        return result;
    }

    /**
     * Parse a comma-separated feature string from Redis into a double[4] vector.
     * Provides strict fallback defaults for any missing or malformed field.
     *
     * @param raw    the raw Redis value (String or null)
     * @param itemId item identifier for logging cold-start events
     * @return feature vector [ctr, recency_hours, segment_power, segment_new]
     */
    private double[] parseFeatureString(Object raw, String itemId) {
        if (raw == null) {
            log.debug("[COLD-START] No features found in Redis for item={} — using defaults", itemId);
            return coldStartFeatures();
        }

        String[] parts = raw.toString().split(",", -1);
        double[] features = coldStartFeatures();  // start with safe defaults

        try {
            if (parts.length > 0) features[0] = parseDoubleSafe(parts[0], DEFAULT_CTR);
            if (parts.length > 1) features[1] = parseDoubleSafe(parts[1], DEFAULT_RECENCY);
            if (parts.length > 2) features[2] = parseDoubleSafe(parts[2], DEFAULT_SEG_POWER);
            if (parts.length > 3) features[3] = parseDoubleSafe(parts[3], DEFAULT_SEG_NEW);
        } catch (Exception e) {
            log.warn("[FEATURE-PARSE] Malformed feature string for item={}: '{}' — using defaults", itemId, raw);
            return coldStartFeatures();
        }

        return features;
    }

    private double[] coldStartFeatures() {
        return new double[]{DEFAULT_CTR, DEFAULT_RECENCY, DEFAULT_SEG_POWER, DEFAULT_SEG_NEW};
    }

    private double parseDoubleSafe(String s, double fallback) {
        try {
            return Double.parseDouble(s.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
