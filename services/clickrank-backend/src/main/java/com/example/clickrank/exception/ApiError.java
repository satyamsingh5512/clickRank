package com.example.clickrank.exception;

import java.time.Instant;

/**
 * Standard API error response model.
 */
public record ApiError(
    int status,
    String message,
    Instant timestamp
) {}