package com.example.clickrank.controller;

import com.example.clickrank.model.RankedResult;
import com.example.clickrank.model.TrendingQuery;
import com.example.clickrank.service.RankingEngine;
import com.example.clickrank.service.SearchResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST controller for serving search results.
 * Response shapes match the frontend SearchResponse / DebugResponse TypeScript types.
 */
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchResultService searchResultService;
    private final RankingEngine rankingEngine;

    /**
     * Main search endpoint — two-stage LTR (L1 retrieval + L2 ML re-ranking).
     *
     * <p>Optional headers for user context:
     * <ul>
     *   <li>{@code X-User-Id}      — caller's user identifier (default: "anonymous")</li>
     *   <li>{@code X-User-Segment} — segment: 'power' | 'new' | 'returning' | 'default'</li>
     *   <li>{@code X-User-Intent}  — intent:  'browse' | 'buy'</li>
     * </ul>
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam(value = "q", required = false, defaultValue = "") String query,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestHeader(value = "X-User-Id",      required = false, defaultValue = "anonymous") String userId,
            @RequestHeader(value = "X-User-Segment", required = false, defaultValue = "default")   String segment,
            @RequestHeader(value = "X-User-Intent",  required = false, defaultValue = "browse")    String intent) {

        List<RankedResult> results = searchResultService.search(
                query.isBlank() ? "" : query, limit, userId, segment, intent);

        List<Map<String, Object>> resultList = results.stream().map(r -> {
            Map<String, Object> item = new HashMap<>();
            item.put("itemId", r.resultId());
            item.put("itemName", r.title());
            item.put("category", category != null ? category : "general");
            item.put("score", r.score());
            item.put("rank", r.rank());
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("query", query);
        response.put("category", category);
        response.put("totalResults", resultList.size());
        response.put("timestamp", System.currentTimeMillis());
        response.put("results", resultList);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/trending")
    public ResponseEntity<List<TrendingQuery>> getTrending() {
        Set<ZSetOperations.TypedTuple<Object>> trending = rankingEngine.getTrendingQueries(10);

        if (trending == null || trending.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<TrendingQuery> trendingList = trending.stream()
                .map(t -> new TrendingQuery((String) t.getValue(), t.getScore()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(trendingList);
    }

    @GetMapping("/stats/{query}")
    public ResponseEntity<Map<String, Double>> getStats(
            @PathVariable String query,
            @RequestParam String resultId) {

        Double score = rankingEngine.getScore(query, resultId);
        if (score == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of("score", score));
    }

    /**
     * Debug endpoint for the explainability console.
     * Returns per-item scoring breakdown: { results: [{itemId, itemName, category, rank, computedScore, clickCount, avgPosition}] }
     */
    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> getDebug(@RequestParam("q") String query) {
        List<RankedResult> results = searchResultService.search(query, 10);

        List<Map<String, Object>> debugItems = results.stream().map(r -> {
            // Derive simulated click metrics from score — would be fetched from analytics in production
            int clickCount = (int) Math.max(1, r.score() * 100);
            double avgPosition = Math.max(1.0, r.rank() + (Math.random() * 2 - 1));

            Map<String, Object> entry = new HashMap<>();
            entry.put("itemId", r.resultId());
            entry.put("itemName", r.title());
            entry.put("category", "simulated");
            entry.put("rank", r.rank());
            entry.put("computedScore", r.score());
            entry.put("clickCount", clickCount);
            entry.put("avgPosition", avgPosition);
            return entry;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("results", debugItems);

        return ResponseEntity.ok(response);
    }
}