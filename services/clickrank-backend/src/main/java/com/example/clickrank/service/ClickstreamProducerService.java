package com.example.clickrank.service;

import com.example.clickrank.model.ClickstreamEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Produces clickstream ingestion events to Kafka topic clickstream-events.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClickstreamProducerService {

    private final KafkaTemplate<String, ClickstreamEvent> clickstreamKafkaTemplate;

    @Value("${clickstream.topic:clickstream-events}")
    private String clickstreamTopic;

    public String publish(ClickstreamEvent payload) {
        final String eventId = UUID.randomUUID().toString();
        final String partitionKey = payload.userId();

        CompletableFuture<SendResult<String, ClickstreamEvent>> sendFuture =
                clickstreamKafkaTemplate.send(clickstreamTopic, partitionKey, payload);

        sendFuture.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish clickstream event eventId={} userId={} itemId={} reason={}",
                        eventId, payload.userId(), payload.itemId(), ex.getMessage(), ex);
                return;
            }

            log.info("Published clickstream event eventId={} topic={} partition={} offset={} userId={} itemId={}",
                    eventId,
                    clickstreamTopic,
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset(),
                    payload.userId(),
                    payload.itemId());
        });

        return eventId;
    }
}
