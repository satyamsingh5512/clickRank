package com.example.clickrank.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.KafkaException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the REST APIs.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(KafkaException.class)
    public ResponseEntity<ApiError> handleKafkaException(KafkaException ex) {
        log.error("Kafka error: ", ex);
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, "Message broker is currently unavailable");
    }

    @ExceptionHandler(RedisConnectionFailureException.class)
    public ResponseEntity<ApiError> handleRedisException(RedisConnectionFailureException ex) {
        log.error("Redis error: ", ex);
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, "Cache layer is currently unavailable");
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFoundException(ResourceNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage()));
        
        ApiError apiError = new ApiError(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            Instant.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAllUncaughtException(Exception ex) {
        log.error("Unknown error occurred", ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    private ResponseEntity<ApiError> buildErrorResponse(HttpStatus status, String message) {
        ApiError error = new ApiError(status.value(), message, Instant.now());
        return ResponseEntity.status(status).body(error);
    }
}