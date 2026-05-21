package com.example.clickrank.model;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

/**
 * Represents a user click event on a search result.
 */
public record ClickEvent(
    @NotBlank String userId,
    @NotBlank String query,
    @NotBlank String resultId,
    @NotBlank String sessionId,
    Instant timestamp
) {
    public ClickEvent {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}