package com.example.clickrank.service;

import com.example.clickrank.model.RankedResult;
import com.example.clickrank.model.SearchResult;
import com.example.clickrank.repository.SearchResultRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for retrieving and ML-ranking search results.
 *
 * <h3>Two-Stage LTR Search Flow</h3>
 * <pre>
 *  1. L1 Retrieval — Redis ZSet cache for previously-clicked results (fast path)
 *     └─► Cache HIT:  extract candidate IDs from ZSet
 *     └─► Cache MISS: PostgreSQL fallback — scan by query keyword
 *
 *  2. L2 Re-ranking — MlRankingClient orchestrates:
 *     a. Batch MGET feature lookup from Redis  (single round-trip)
 *     b. POST /v1/rank to FastAPI/ONNX service (Resilience4j guarded)
 *     c. Fallback to trending ZSet if ML unavailable
 *
 *  3. DB hydration — fetch full SearchResult entities by ML-ranked IDs
 * </pre>
 */
@Slf4j
@Service
public class SearchResultService {

    private static final String DEFAULT_SEGMENT = "default";
    private static final String DEFAULT_INTENT  = "browse";
    private static final String SYSTEM_USER_ID  = "system";

    private final RankingEngine rankingEngine;
    private final SearchResultRepository repository;
    private final MlRankingClient mlRankingClient;
    private final Counter cacheHitCounter;
    private final Counter cacheMissCounter;
    private final Counter mlRankedCounter;

    public SearchResultService(
            RankingEngine rankingEngine,
            SearchResultRepository repository,
            MlRankingClient mlRankingClient,
            MeterRegistry meterRegistry) {
        this.rankingEngine = rankingEngine;
        this.repository = repository;
        this.mlRankingClient = mlRankingClient;
        this.cacheHitCounter  = meterRegistry.counter("redis.cache.hits",   "type", "search");
        this.cacheMissCounter = meterRegistry.counter("redis.cache.misses",  "type", "search");
        this.mlRankedCounter  = meterRegistry.counter("ml.ranking.invocations", "type", "search");
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Full two-stage search: L1 retrieval → L2 ML re-ranking → DB hydration.
     *
     * @param query   keyword query string
     * @param limit   max results to return
     * @param userId  calling user ID (forwarded to ML service for personalisation)
     * @param segment user segment — 'power' | 'new' | 'returning' | 'default'
     * @param intent  user intent  — 'browse' | 'buy'
     */
    @Transactional(readOnly = true)
    public List<RankedResult> search(
            String query,
            int limit,
            String userId,
            String segment,
            String intent) {

        // ── L1: Retrieve candidate IDs ─────────────────────────────────────────
        List<String> candidateIds = retrieveCandidateIds(query, limit);

        if (candidateIds.isEmpty()) {
            return Collections.emptyList();
        }

        // ── L2: ML Re-ranking ─────────────────────────────────────────────────
        List<String> rankedIds = mlRerank(candidateIds, userId, segment, intent);

        // ── Hydrate: fetch full entities and preserve ML order ─────────────────
        return hydrateAndOrder(rankedIds, limit);
    }

    /**
     * Overload for callers that don't supply user context (debug/legacy endpoints).
     */
    @Transactional(readOnly = true)
    public List<RankedResult> search(String query, int limit) {
        return search(query, limit, SYSTEM_USER_ID, DEFAULT_SEGMENT, DEFAULT_INTENT);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * L1 retrieval: Redis ZSet first, PostgreSQL fallback.
     */
    private List<String> retrieveCandidateIds(String query, int limit) {
        Set<ZSetOperations.TypedTuple<Object>> zsetResults = rankingEngine.getTopResults(query, limit);

        if (zsetResults != null && !zsetResults.isEmpty()) {
            cacheHitCounter.increment();
            log.debug("L1 cache hit for query=[{}] — {} candidates from Redis ZSet", query, zsetResults.size());
            return zsetResults.stream()
                    .map(t -> (String) t.getValue())
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }

        // Cache miss — fall back to PostgreSQL
        cacheMissCounter.increment();
        log.debug("L1 cache miss for query=[{}] — querying PostgreSQL", query);
        List<SearchResult> dbResults = repository.findByQuery(query);
        return dbResults.stream()
                .limit(limit)
                .map(SearchResult::getId)
                .collect(Collectors.toList());
    }

    /**
     * L2 re-ranking via MlRankingClient (ONNX + Redis feature MGET + Resilience4j).
     * Falls back to original candidate order on any exception.
     */
    private List<String> mlRerank(
            List<String> candidateIds,
            String userId,
            String segment,
            String intent) {
        try {
            mlRankedCounter.increment();
            List<String> ranked = mlRankingClient.rankCandidates(candidateIds, userId, segment, intent);
            log.debug("ML re-ranking returned {} IDs (input {})", ranked.size(), candidateIds.size());
            return ranked;
        } catch (Exception ex) {
            // MlRankingClient already has its own Resilience4j fallback;
            // this catch is a final safety net so search never throws.
            log.warn("ML re-ranking threw unexpected exception — falling back to L1 order: {}", ex.getMessage());
            return candidateIds;
        }
    }

    /**
     * Fetch SearchResult entities by IDs and reassemble in ML-ranked order.
     * Items not found in the DB are silently dropped (stale cache).
     */
    private List<RankedResult> hydrateAndOrder(List<String> orderedIds, int limit) {
        // Batch DB fetch — one query for all IDs
        Map<String, SearchResult> entityMap = repository.findAllById(orderedIds).stream()
                .collect(Collectors.toMap(SearchResult::getId, r -> r));

        List<RankedResult> results = new ArrayList<>(Math.min(orderedIds.size(), limit));
        int rank = 1;
        for (String id : orderedIds) {
            SearchResult entity = entityMap.get(id);
            if (entity == null) {
                log.debug("Stale candidate id={} not found in DB — skipping", id);
                continue;
            }
            results.add(new RankedResult(entity.getId(), entity.getTitle(), entity.getUrl(), 0.0, rank++));
            if (results.size() >= limit) break;
        }
        return results;
    }
}