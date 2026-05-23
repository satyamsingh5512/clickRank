package com.example.clickrank.util;

/**
 * Utility class for consistent Redis key naming.
 */
public final class RedisKeyUtils {

    private RedisKeyUtils() {
        // Utility class
    }

    public static String rankingsKey(String query) {
        return "rankings:query:" + normalize(query);
    }

    public static String processedEventKey(String eventId) {
        return "processed:event:" + eventId;
    }

    public static String trendingKey() {
        return "trending:queries";
    }

    private static String normalize(String input) {
        return input == null ? "" : input.trim().toLowerCase();
    }
}