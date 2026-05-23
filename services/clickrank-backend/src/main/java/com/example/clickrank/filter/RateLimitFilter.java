package com.example.clickrank.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Basic rate limiting filter using Bucket4j.
 * @deprecated Phase 4 moved Rate Limiting to the Spring Cloud API Gateway via Redis.
 * This class is left for reference but is no longer actively enforced here as to not double-penalize latency.
 */
@Deprecated
public class RateLimitFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // Pass-through as rate limiting is now handled by API Gateway
        filterChain.doFilter(request, response);
    }
}