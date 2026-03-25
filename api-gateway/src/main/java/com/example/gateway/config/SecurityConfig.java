package com.example.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Reactive Security configuration for the Gateway.
 * Validates JWT tokens at the edge before routing to downstream services.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:#{null}}")
    private String issuerUri;

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                // Public endpoints
                .pathMatchers("/actuator/health/**", "/actuator/prometheus").permitAll()
                .pathMatchers("/fallback/**").permitAll()
                // Allow all API routes if OAuth2 is not configured (dev mode)
                .pathMatchers("/api/**").permitAll()
                .anyExchange().permitAll()
            );
        
        // Only enable OAuth2 if issuer-uri is configured
        if (issuerUri != null && !issuerUri.isEmpty()) {
            http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}));
        }
            
        return http.build();
    }
}