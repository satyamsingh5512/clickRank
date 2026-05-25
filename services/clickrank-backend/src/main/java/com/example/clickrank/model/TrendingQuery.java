package com.example.clickrank.model;

/**
 * DTO for trending queries.
 */
public record TrendingQuery(
    String query,
    Double totalClicks
) {}