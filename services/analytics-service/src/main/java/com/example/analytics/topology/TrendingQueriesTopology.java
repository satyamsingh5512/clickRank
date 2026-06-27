package com.example.analytics.topology;

import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.Grouped;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.Materialized;
import org.apache.kafka.streams.kstream.Produced;
import org.apache.kafka.streams.kstream.TimeWindows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Phase 7: Kafka Streams Topology
 * Computes a tumbling window aggregation of clicks per query over the last 5 minutes.
 */
@Component
public class TrendingQueriesTopology {

    @Autowired
    public void buildPipeline(StreamsBuilder builder) {
        
        KStream<String, String> clickStream = builder.stream(
            "raw-click-events", 
            Consumed.with(Serdes.String(), Serdes.String())
        );

        // Calculate clicks per query within 5 minute tumbling windows
        clickStream
            // We assume the key of raw-click-events is the query string
            .groupByKey(Grouped.with(Serdes.String(), Serdes.String()))
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
            .count(Materialized.as("trending-queries-store"))
            .toStream()
            // Map the complex Windowed<String> key to a simple string for output topic
            .map((windowedKey, count) -> 
                 org.apache.kafka.streams.KeyValue.pair(
                     windowedKey.key() + "@" + windowedKey.window().start(), 
                     count.toString()
                 )
            )
            .to("trending-queries-5min-window", Produced.with(Serdes.String(), Serdes.String()));
    }
}