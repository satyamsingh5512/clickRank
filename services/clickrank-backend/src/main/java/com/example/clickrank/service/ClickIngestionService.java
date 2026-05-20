package com.example.clickrank.service;

import com.example.clickrank.model.ClickEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Service for ingesting click events and publishing them to Kafka.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClickIngestionService {

    private final KafkaTemplate<String, ClickEvent> kafkaTemplate;
    private static final String TOPIC = "raw-click-events";

    /**
     * Publishes a click event to Kafka in a non-blocking way.
     * @param event The click event
     * @return Generated event ID
     */
    public String publishClick(ClickEvent event) {
        String eventId = UUID.randomUUID().toString();
        // Using query as partition key ensures all clicks for the same query go to the same partition
        CompletableFuture<SendResult<String, ClickEvent>> future = 
            kafkaTemplate.send(TOPIC, event.query(), event);
            
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Sent click event for query=[{}] to partition=[{}] with offset=[{}]", 
                    event.query(), result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
            } else {
                log.error("Unable to send click event for query=[{}] due to: {}", event.query(), ex.getMessage());
            }
        });
        
        return eventId;
    }
}