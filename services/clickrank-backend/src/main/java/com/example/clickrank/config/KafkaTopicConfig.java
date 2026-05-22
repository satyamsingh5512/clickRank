package com.example.clickrank.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.config.TopicConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Configuration for Kafka topics.
 */
@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic rawClickEventsTopic() {
        return TopicBuilder.name("raw-click-events")
                .partitions(3)
                .replicas(1) // Single broker in dev
                .build();
    }

    @Bean
    public NewTopic clickstreamEventsTopic() {
        return TopicBuilder.name("clickstream-events")
                .partitions(3)
                .replicas(1)
                .config(TopicConfig.CLEANUP_POLICY_CONFIG, TopicConfig.CLEANUP_POLICY_DELETE)
                .build();
    }

    @Bean
    public NewTopic rankedResultsUpdatesTopic() {
        return TopicBuilder.name("ranked-results-updates")
                .partitions(3)
                .replicas(1) // Single broker in dev
                .build();
    }
    
    @Bean
    public NewTopic rawClickEventsDltTopic() {
        return TopicBuilder.name("raw-click-events-dlt")
                .partitions(1)
                .replicas(1) // Single broker in dev
                .build();
    }
}
