# Real-Time Click Stream Search Ranking System

A production-ready Spring Boot microservice that processes real-time user click events to calculate and serve search rankings using Apache Kafka and Redis.

## Architecture

```text
User Click
    │
    ▼
[ POST /api/click ] (REST API)
    │
    ▼
( Kafka Producer ) ──► [ Topic: raw-click-events ] ──► ( Kafka Consumer )
                                                              │
                                                              ▼
                                                     ( Ranking Engine )
                                                              │
                                                              ▼ ZINCRBY
[ GET /api/search?q=... ] ◄── ZREVRANGE ◄────────── [ Redis Sorted Set ]
    │                                                         │
    ▼ (Cache Miss)                                            │
[ PostgreSQL ] ◄──────────────────────────────────────────────┘
```

## Prerequisites
- Java 17
- Maven 3.8+
- Docker & Docker Compose

## Tech Stack
- **Spring Boot 3.2.x** (Web, Data JPA, Data Redis, Actuator)
- **Apache Kafka 3.x** (Message Broker)
- **Redis 7** (In-memory Data Structure Store)
- **PostgreSQL 15** (Relational Database)
- **Docker Compose** (Infrastructure orchestration)

## How to Run

1. **Start the Infrastructure:**
   ```bash
   docker-compose up -d
   ```
   This will start Zookeeper, Kafka, Redis, PostgreSQL, and Kafdrop.

2. **Run the Application:**
   ```bash
   mvn spring-boot:run
   ```
   The application will start on `http://localhost:8081` (port `8080` is taken by Kafdrop).

## How to Test

**1. Record a Click Event:**
```bash
curl -X POST http://localhost:8081/api/click \
     -H "Content-Type: application/json" \
     -d '{"userId": "u123", "query": "iphone", "resultId": "r42", "sessionId": "s99"}'
```

**2. Search Results (Ranked):**
```bash
curl "http://localhost:8081/api/search?q=iphone&limit=10"
```

**3. Get Trending Queries:**
```bash
curl "http://localhost:8081/api/search/trending"
```

## Monitoring

- **Kafdrop (Kafka UI):** Navigate to `http://localhost:8080` to inspect Kafka topics, partitions, and messages.
- **Spring Boot Actuator:** Metrics available at `http://localhost:8081/actuator`
- **Redis:** Connect via `redis-cli -h localhost -p 6379` or any Redis GUI client.
- **PostgreSQL:** Connect via `psql -h localhost -p 5432 -U clickrank -d clickrank_db` (Password: `password`).

## Architecture Decisions

- **Why Kafka?** Kafka handles high-throughput click streams effortlessly and provides durable, order-preserved messaging (partitioned by query). It decouples the ingestion API from the heavy lifting of ranking computation.
- **Why Redis Sorted Sets (ZSET)?** Redis ZSET provides native O(log(N)) operations for ranking items (`ZINCRBY` behavior handled via atomic Lua script to accommodate score decay) and retrieving top items (`ZREVRANGEBYRANK`). It's the perfect data structure for real-time leaderboards.
- **Why Cache-Aside?** To ensure high availability, Redis handles all reads. If a query is not in Redis or Redis is down, the system gracefully falls back to PostgreSQL to serve initial results.
