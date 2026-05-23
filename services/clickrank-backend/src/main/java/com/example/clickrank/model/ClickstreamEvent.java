package com.example.clickrank.model;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

/**
 * Canonical clickstream event used by /api/clicks ingestion API.
 */
public record ClickstreamEvent(
        @NotBlank String userId,
        @NotBlank String itemId,
        Instant timestamp
) {
    public ClickstreamEvent {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}
