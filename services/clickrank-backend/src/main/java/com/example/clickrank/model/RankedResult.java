package com.example.clickrank.model;

/**
 * DTO returned to the client containing the result and its ranking score.
 */
public record RankedResult(
    String resultId,
    String title,
    String url,
    Double score,
    Integer rank
) {}