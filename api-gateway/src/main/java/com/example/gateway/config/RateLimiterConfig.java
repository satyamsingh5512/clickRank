package com.example.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

import java.util.Objects;

/**
 * Configuration for Gateway Rate Limiting.
 */
@Configuration
public class RateLimiterConfig {

    /**
     * Resolves the rate limit key based on the client's IP address.
     * In a real production setup (e.g., behind a load balancer), you'd look at the X-Forwarded-For header.
     */
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.just(
            Objects.requireNonNull(exchange.getRequest().getRemoteAddress()).getAddress().getHostAddress()
        );
    }
    
    // Alternatively, you could limit by user ID extracted from the JWT token:
    /*
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication().getName())
            .switchIfEmpty(Mono.just("anonymous"));
    }
    */
}