package com.example.clickrank.repository;

import com.example.clickrank.model.SearchResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for SearchResult entity.
 */
@Repository
public interface SearchResultRepository extends JpaRepository<SearchResult, String> {
    
    List<SearchResult> findByQuery(String query);
}