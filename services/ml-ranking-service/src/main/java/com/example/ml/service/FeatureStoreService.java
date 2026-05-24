package com.example.ml.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Phase 8: Feature Store Client
 * Fetches pre-computed features from Redis hashes.
 */
@Service
@RequiredArgsConstructor
public class FeatureStoreService {

    private final RedisTemplate<String, Object> redisTemplate;

    public Map<Object, Object> getFeaturesForContext(String query, String resultId) {
        String featureKey = "features:" + query + ":" + resultId;
        // Expecting keys like "ctr", "recency", "position_bias"
        return redisTemplate.opsForHash().entries(featureKey);
    }
}