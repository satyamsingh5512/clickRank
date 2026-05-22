package com.example.clickrank.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis configuration providing two template beans:
 *
 * <ul>
 *   <li>{@code RedisTemplate<String, Object>} — primary template used by {@link com.example.clickrank.service.RankingEngine}
 *       for Sorted Set operations (ZSet), idempotency keys, and JSON-serialised values.</li>
 *   <li>{@code StringRedisTemplate} — used by {@link com.example.clickrank.service.MlRankingClient}
 *       for pipelined MGET on plain-text feature strings stored as
 *       {@code "ctr,recency_hours,segment_power,segment_new"}.</li>
 * </ul>
 *
 * <p>Keeping two separate templates avoids deserialisation conflicts: the JSON template
 * would attempt to parse plain feature strings as JSON objects, causing ClassCastExceptions.</p>
 */
@Configuration
public class RedisConfig {

    /**
     * Primary template for JSON-serialised values (ZSet scores, processed-event keys, etc.).
     */
    @Bean
    @Primary
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.setDefaultSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * String-only template used for pipelined MGET of plain-text feature vectors.
     * <p>
     * Using {@link StringRedisTemplate} avoids the Java-type header that
     * {@link GenericJackson2JsonRedisSerializer} prepends, making the keys interoperable
     * with feature strings written by the Python analytics/feature pipeline.
     * </p>
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }
}