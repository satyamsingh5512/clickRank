package com.example.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Reactive Security configuration for the Gateway.
 * Validates JWT tokens at the edge before routing to downstream services.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:#{null}}")
    private String issuerUri;

    @Value("${app.security.require-auth:false}")
    private boolean requireAuth;

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http.csrf(ServerHttpSecurity.CsrfSpec::disable);

        if (requireAuth) {
            http.authorizeExchange(exchanges -> exchanges
                .pathMatchers("/actuator/health/**", "/actuator/prometheus").permitAll()
                .pathMatchers("/fallback/**").permitAll()
                .pathMatchers("/api/**").authenticated()
                .anyExchange().authenticated()
            );
        } else {
            http.authorizeExchange(exchanges -> exchanges.anyExchange().permitAll());
        }

        if (requireAuth) {
            if (issuerUri == null || issuerUri.isBlank()) {
                log.warn("Gateway auth required but issuer-uri is empty. Requests to /api/** will fail until issuer-uri is configured.");
            }
            http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}));
        } else {
            log.info("Gateway auth is disabled (app.security.require-auth=false).");
        }

        return http.build();
    }
}
