package com.example.clickrank.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity representing a searchable item in the database.
 */
@Entity
@Table(name = "search_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResult {
    @Id
    private String id;
    private String title;
    private String url;
    private String description;
    private String query;
    private Instant createdAt;
}