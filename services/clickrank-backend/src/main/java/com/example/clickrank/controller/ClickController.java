package com.example.clickrank.controller;

import com.example.clickrank.model.ClickEvent;
import com.example.clickrank.service.ClickIngestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for click event ingestion.
 */
@RestController
@RequestMapping("/api/click")
@RequiredArgsConstructor
public class ClickController {

    private final ClickIngestionService clickIngestionService;

    @PostMapping
    public ResponseEntity<Map<String, String>> recordClick(@Valid @RequestBody ClickEvent event) {
        String eventId = clickIngestionService.publishClick(event);
        
        return ResponseEntity.accepted().body(Map.of(
            "message", "Click recorded",
            "eventId", eventId
        ));
    }
}