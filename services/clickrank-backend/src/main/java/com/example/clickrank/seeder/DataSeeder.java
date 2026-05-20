package com.example.clickrank.seeder;

import com.example.clickrank.model.SearchResult;
import com.example.clickrank.repository.SearchResultRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Seeds the database with initial search results.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder {

    private final SearchResultRepository repository;

    @PostConstruct
    public void seed() {
        if (repository.count() > 0) {
            log.info("Database already seeded. Skipping.");
            return;
        }

        log.info("Seeding database with initial search results...");
        List<SearchResult> results = new ArrayList<>();
        
        String[] queries = {"iphone", "laptop", "headphones", "shoes", "books"};
        
        for (String query : queries) {
            for (int i = 1; i <= 10; i++) {
                results.add(SearchResult.builder()
                        .id("r" + UUID.randomUUID().toString().substring(0, 8))
                        .query(query)
                        .title(capitalize(query) + " Product " + i)
                        .description("High quality " + query + " description " + i)
                        .url("https://example.com/products/" + query + "/" + i)
                        .createdAt(Instant.now())
                        .build());
            }
        }
        
        // Add a specific one for testing matching the prompt
        results.add(SearchResult.builder()
                .id("r42")
                .query("iphone")
                .title("iPhone 15 Pro")
                .description("The latest titanium iPhone")
                .url("https://example.com/iphone-15-pro")
                .createdAt(Instant.now())
                .build());
        
        repository.saveAll(results);
        log.info("Successfully seeded {} items.", results.size());
    }
    
    private String capitalize(String str) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}