package com.example.clickrank.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * WebClient configuration for the ML Ranking Service HTTP integration.
 *
 * <p>Timeout budget is structured so Resilience4j's {@code slowCallDurationThreshold}
 * (25 ms) correctly identifies slow ML responses before the TCP/Netty read timeout
 * (500 ms) fires. The Resilience4j circuit opens first; the WebClient timeout is a
 * final safety net for catastrophic hangs.
 *
 * <pre>
 *   Resilience4j slowCallThreshold → 25 ms  (circuit metric)
 *   Mono.timeout() in caller       → 500 ms (reactive timeout)
 *   Netty readTimeout              → 800 ms (TCP-level safety net)
 * </pre>
 */
@Configuration
public class WebClientConfig {

    @Value("${ml.service.base-url:http://ml-ranking-service:8084}")
    private String mlServiceBaseUrl;

    @Bean
    public WebClient mlWebClient() {
        HttpClient httpClient = HttpClient.create()
                // TCP connection timeout — fail fast if the pod is unreachable
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 1_000)
                .responseTimeout(Duration.ofMillis(800))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(800, TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(200, TimeUnit.MILLISECONDS))
                );

        return WebClient.builder()
                .baseUrl(mlServiceBaseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
