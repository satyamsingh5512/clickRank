package com.example.clickrank.consumer;

import com.example.clickrank.model.ClickEvent;
import com.example.clickrank.service.FeatureWriterService;
import com.example.clickrank.service.RankingEngine;
import com.example.clickrank.util.RedisKeyUtils;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Kafka Consumer for processing raw click events.
 */
@Slf4j
@Service
public class ClickEventConsumer {

    private final RankingEngine rankingEngine;
    private final FeatureWriterService featureWriterService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final Timer processingTimer;

    public ClickEventConsumer(
            RankingEngine rankingEngine,
            FeatureWriterService featureWriterService,
            RedisTemplate<String, Object> redisTemplate,
            MeterRegistry meterRegistry) {
        this.rankingEngine = rankingEngine;
        this.featureWriterService = featureWriterService;
        this.redisTemplate = redisTemplate;
        this.processingTimer = meterRegistry.timer("kafka.consumer.processing.time", "topic", "raw-click-events");
    }

    @RetryableTopic(
        attempts = "3",
        backoff = @Backoff(delay = 1000, multiplier = 2.0),
        autoCreateTopics = "false",
        dltTopicSuffix = "-dlt",
        kafkaTemplate = "kafkaTemplate"
    )
    @KafkaListener(
        topics = "raw-click-events", 
        groupId = "${spring.kafka.consumer.group-id}",
        concurrency = "3"
    )
    public void consume(ClickEvent event, 
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        @Header(KafkaHeaders.OFFSET) long offset) {
        
        processingTimer.record(() -> {
            log.info("Received event for query=[{}] from partition={} offset={}", event.query(), partition, offset);
            
            // Use sessionId + timestamp + resultId as a synthetic unique ID if event ID isn't provided in the payload itself
            String syntheticEventId = event.sessionId() + "-" + event.resultId() + "-" + event.timestamp().toEpochMilli();
            String idempotencyKey = RedisKeyUtils.processedEventKey(syntheticEventId);
            
            try {
                // Idempotency check: Set if not exists with 5-min TTL
                Boolean isNew = redisTemplate.opsForValue().setIfAbsent(idempotencyKey, "1", Duration.ofMinutes(5));
                
                if (Boolean.TRUE.equals(isNew)) {
                    rankingEngine.updateScore(event.query(), event.resultId());
                    // Update the feature store so MlRankingClient has fresh CTR/recency data
                    featureWriterService.recordClick(
                            event.resultId(),
                            event.timestamp(),
                            "default"  // segment resolved from user profile in production
                    );
                    log.info("Successfully processed event for query=[{}] result=[{}]", event.query(), event.resultId());
                } else {
                    log.info("Duplicate event ignored: {}", syntheticEventId);
                }
            } catch (Exception e) {
                log.error("Error processing event, will retry. Error: {}", e.getMessage());
                // Clear idempotency key so retry can proceed if it was partially processed
                redisTemplate.delete(idempotencyKey);
                throw e; // Rethrow to trigger @RetryableTopic
            }
        });
    }
}
