package com.example.ml.controller;

import com.example.ml.service.ModelScoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ml")
public class MLRankingController {

    @Autowired
    private ModelScoringService modelScoringService;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "ml-ranking-service");
    }

    @PostMapping("/score")
    public Map<String, Object> scoreCandidate(@RequestParam String query, @RequestParam String resultId) {
        double score = modelScoringService.scoreCandidate(query, resultId);
        return Map.of("score", score, "query", query, "resultId", resultId);
    }
}
