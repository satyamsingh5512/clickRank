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

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                // Public endpoints
                .pathMatchers("/actuator/health/**", "/actuator/prometheus").permitAll()
                .pathMatchers("/fallback/**").permitAll()
                .pathMatchers("/api/**").authenticated()
                .anyExchange().authenticated()
            );

        if (issuerUri == null || issuerUri.isBlank()) {
            log.warn("Gateway JWT validation is enabled but issuer-uri is empty. Set spring.security.oauth2.resourceserver.jwt.issuer-uri.");
        }

        http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}));

        return http.build();
    }
}
