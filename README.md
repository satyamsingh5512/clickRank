# ClickRank 🚀

## System Design (Architecture)
ClickRank uses a distributed **Two-Stage Learning-to-Rank pipeline** that combines Java microservices, a Python ML engine, and a Kafka streaming ecosystem.

```mermaid
flowchart TB
    Client["📱 React Frontend (Vite)"] -- "1. Search / Click" --> Gateway["🌐 API Gateway (Rate Limiting)"]

    subgraph "Real-Time Serving Layer"
        Gateway -- "2. GET /search" --> Orchestrator["⚙️ LTR Orchestrator (Spring Boot)"]
        
        Orchestrator -- "3. L1 Candidate Retrieval" --> Cache[("⚡ Redis (ZSet Cache)")]
        Orchestrator -. "Fallback" .-> DB[("🐘 PostgreSQL")]
        
        Orchestrator -- "4. Batch Feature Lookup" --> FeatureStore[("🗄️ Redis Feature Store")]
        
        Orchestrator -- "5. Re-rank (Circuit Breaker)" --> MLService["🧠 ML Inference (FastAPI)"]
        MLService -- "XGBoost / ONNX" --> MLService
    end

    subgraph "Event Streaming & Analytics Layer"
        Gateway -- "POST /clicks" --> Ingest["📥 Click Ingestion"]
        Ingest -- "Produce" --> Kafka{"⚡ Kafka Cluster"}
        
        Kafka -- "Consume" --> FeatureWriter["🔄 Feature Writer (EMA)"]
        FeatureWriter -- "Update CTR/Age" --> FeatureStore
        
        Kafka -- "Process" --> Analytics["📊 Kafka Streams (5m Window)"]
        Analytics -- "Trending Data" --> Cache
    end

    classDef db fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef svc fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef client fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef kafka fill:#451a03,stroke:#fbbf24,stroke-width:2px,color:#fff;

    class Cache,DB,FeatureStore db;
    class Orchestrator,MLService,Ingest,Analytics,Gateway svc;
    class Client client;
    class Kafka kafka;
```

## What the project does
ClickRank is an enterprise-grade, event-driven Learning-to-Rank (LTR) search and recommendation platform. It replaces standard, static database text-searches with a high-performance ML pipeline. By continuously capturing user clickstreams and behaviors in real time, ClickRank dynamically re-orders search results to show the most relevant, highest-converting items first.

## How it works
1) The client sends search and click events through the API Gateway.
2) The LTR Orchestrator retrieves candidates from Redis (with PostgreSQL fallback).
3) It batches feature lookups from the Redis feature store.
4) The ML Inference service re-ranks candidates with the model.
5) Kafka streams update features and trending data continuously.

## Tech stack
- Frontend: React, Vite, TypeScript
- Backend: Java (Spring Boot), Python (FastAPI)
- Streaming: Kafka, Kafka Streams
- Data: Redis (ZSet + feature store), PostgreSQL
- ML: XGBoost, ONNX
- Infra: Docker, Kubernetes, Terraform

## The end result
The system is built to provide ultra-low latency, highly personalized search experiences that scale to FAANG-tier traffic volumes.

**Probable Results & Target SLAs:**
- **Blazing Fast Inference:** Evaluates complex XGBoost feature matrices (CTR, recency, user segments) via highly optimized ONNX binaries to achieve `p95 < 35ms` end-to-end latency.
- **Massive Throughput:** Capable of sustaining **3,000+ QPS** (Queries Per Second) without degradation.
- **Fault-Tolerant by Design:** Guarded by Resilience4j Circuit Breakers. If the ML pipeline crashes or lags, the platform gracefully degrades in milliseconds to fallback ZSet retrieval, ensuring users never see an error page.
- **Premium UX:** Masks any underlying network latency with sleek "Enterprise Dark Mode" UI micro-interactions, providing users with a frictionless, high-end bento-box search experience.
