package com.example.clickrank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main entry point for the ClickRank Spring Boot application.
 */
@SpringBootApplication
@EnableAsync
public class ClickRankApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClickRankApplication.class, args);
    }

}