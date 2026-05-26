package com.example.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Controller handling Circuit Breaker fallback responses.
 */
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/click")
    public Mono<ResponseEntity<Map<String, String>>> clickFallback() {
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("error", "Click ingestion service is temporarily unavailable. Please try again later.")));
    }

    @RequestMapping("/search")
    public Mono<ResponseEntity<Map<String, String>>> searchFallback() {
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("error", "Search service is currently degraded. Results may be delayed.")));
    }
}