package com.example.clickrank.controller;

import com.example.clickrank.model.ClickstreamEvent;
import com.example.clickrank.service.ClickstreamProducerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * New ingestion endpoint for clickstream producer contract.
 */
@RestController
@RequestMapping("/api/clicks")
@RequiredArgsConstructor
public class ClickstreamController {

    private final ClickstreamProducerService clickstreamProducerService;

    @PostMapping
    public ResponseEntity<Map<String, String>> ingest(@Valid @RequestBody ClickstreamEvent event) {
        String eventId = clickstreamProducerService.publish(event);

        return ResponseEntity.accepted().body(Map.of(
                "status", "accepted",
                "eventId", eventId,
                "topic", "clickstream-events"
        ));
    }
}
