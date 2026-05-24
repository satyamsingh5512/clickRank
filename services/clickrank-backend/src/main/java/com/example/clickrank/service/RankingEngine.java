package com.example.clickrank.service;

import com.example.clickrank.util.RedisKeyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.Set;

/**
 * Engine responsible for computing and retrieving ranking scores using Redis Sorted Sets.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RankingEngine {

    private final RedisTemplate<String, Object> redisTemplate;
    
    @Value("${ranking.ttl-hours:1}")
    private long ttlHours;

    private static final String UPDATE_SCORE_SCRIPT = 
        "local score = redis.call('ZSCORE', KEYS[1], ARGV[1]); " +
        "if not score then score = 0 else score = tonumber(score) end; " +
        "local newScore = (score * 0.95) + 1.0; " +
        "redis.call('ZADD', KEYS[1], newScore, ARGV[1]); " +
        "return tostring(newScore);"; 

    /**
     * Updates the score of a result for a given query in Redis atomically.
     */
    public void updateScore(String query, String resultId) {
        String key = RedisKeyUtils.rankingsKey(query);
        String trendingKey = RedisKeyUtils.trendingKey();
        
        try {
            DefaultRedisScript<String> redisScript = new DefaultRedisScript<>(UPDATE_SCORE_SCRIPT, String.class);
            StringRedisSerializer stringSerializer = new StringRedisSerializer();
            
            String newScoreStr = redisTemplate.execute(
                redisScript,
                stringSerializer,
                stringSerializer,
                Collections.singletonList(key),
                resultId
            );
            
            // Set TTL on the rankings key
            redisTemplate.expire(key, Duration.ofHours(ttlHours));
            
            // Also update trending queries — refresh TTL to prevent unbounded growth
            redisTemplate.opsForZSet().incrementScore(trendingKey, query, 1.0);
            redisTemplate.expire(trendingKey, Duration.ofHours(24));
            
            log.info("Updated score for query=[{}] result=[{}] to [{}]", query, resultId, newScoreStr);
        } catch (Exception e) {
            log.error("Redis connection failed while updating score for query={}: {}", query, e.getMessage());
        }
    }

    /**
     * Retrieves the top N results for a query from Redis.
     */
    public Set<ZSetOperations.TypedTuple<Object>> getTopResults(String query, int topN) {
        String key = RedisKeyUtils.rankingsKey(query);
        try {
            return redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, topN - 1);
        } catch (Exception e) {
            log.error("Redis connection failed while getting top results for query={}: {}", query, e.getMessage());
            return null;
        }
    }
    
    /**
     * Retrieves top trending queries.
     */
    public Set<ZSetOperations.TypedTuple<Object>> getTrendingQueries(int topN) {
        String key = RedisKeyUtils.trendingKey();
        try {
            return redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, topN - 1);
        } catch (Exception e) {
            log.error("Redis connection failed while getting trending queries: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Gets score stats for a specific query and result.
     */
    public Double getScore(String query, String resultId) {
        String key = RedisKeyUtils.rankingsKey(query);
        try {
            return redisTemplate.opsForZSet().score(key, resultId);
        } catch (Exception e) {
            return null;
        }
    }
}