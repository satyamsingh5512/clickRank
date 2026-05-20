# ClickRank 🚀

ClickRank is an enterprise-grade, event-driven Learning-to-Rank (LTR) search and recommendation platform. It features a distributed microservices architecture, a real-time machine learning inference pipeline, and a premium "Enterprise Dark Mode" frontend.

---

## 🏗 System Architecture & Design

ClickRank implements a **Two-Stage Learning-to-Rank Pipeline** designed for sub-35ms p95 latency at 3,000 QPS.

### 1. Frontend (React + Tailwind v4 + Framer Motion)
- **Omnibox Hero Search:** `Cmd+K` accessible search with glassmorphic design, debounced input, and typing placeholder animations.
- **Bento-Box Results:** Highly interactive UI with AI Relevance Score badges and micro-interactions on hover.
- **Real-Time Trending:** A Kafka-backed sidebar displaying live trending queries.
- **Dev Telemetry Overlay:** A toggleable mode exposing raw XGBoost feature matrices, Resilience4j circuit breaker states, and exact latency breakdowns per request.

### 2. The LTR Orchestrator (Java Spring Boot)
- **L1 Retrieval:** Fetches initial candidate IDs via a Redis ZSet (cached) or falls back to a PostgreSQL lookup.
- **Feature Store & Pipelining:** Uses an Exponential Moving Average (EMA) to update item CTRs in real-time via Kafka. Fetches candidate features using a single-trip Redis `MGET` pipeline.
- **L2 Re-ranking:** Orchestrates the HTTP call to the ML Service.
- **Fault Tolerance:** Wrapped in a **Resilience4j Circuit Breaker**. If the ML service times out (>25ms SLO) or fails, the backend degrades gracefully to the L1 retrieval or a global trending ZSet fallback.

### 3. ML Inference Service (Python + FastAPI)
- **Training Pipeline:** An offline script (`scripts/train_and_export.py`) trains a pairwise `XGBRanker` model (optimizing for `rank:ndcg`) using a 4-dimensional feature vector.
- **Inference Engine:** Compiles the XGBoost model into an ONNX binary (`models/ranker.onnx`) for ultra-low latency, multi-threaded inference using `onnxruntime`.

### 4. Clickstream Ingestion & Analytics
- **Kafka Ecosystem:** Real-time click events are ingested through the API Gateway, dropped onto a Kafka topic, and consumed asynchronously by the backend to update the Redis feature store.
- **Kafka Streams:** A separate analytics service runs a 5-minute tumbling window topology to aggregate and emit trending search queries.

---

## 📂 Repository Structure

```text
clickRank/
├── apps/
│   └── frontend/                # React, Vite, Tailwind v4, Framer Motion
├── services/
│   ├── clickrank-backend/       # Core LTR orchestrator & feature writer (Spring Boot)
│   ├── api-gateway/             # Gateway service & Rate Limiting
│   ├── analytics-service/       # Kafka Streams analytics topology
│   └── ml-ranking-service/      # Python FastAPI + ONNX Runtime scoring service
├── infra/
│   └── docker-compose.yml       # Full local stack orchestration (Kafka, Redis, Postgres)
├── scripts/
│   ├── train_and_export.py      # XGBoost pairwise training & ONNX export
│   ├── seed_redis_features.py   # Populates Redis with 2,000 synthetic feature vectors
│   ├── chaos_test_circuit_breaker.sh # Automated Resilience4j failover validation
│   └── build-all.sh             # Builds all Docker images
├── tests/load/                  # k6 load testing scripts
└── README.md
```

---

## 🚀 Quick Start / Local Runbook

Follow these steps to spin up the entire distributed system locally.

### 1. Train the ML Model
Before starting, generate the ONNX model artifact. The ML container mounts the `models/` directory.
```bash
pip install xgboost==2.1.4 onnxmltools==1.12.0 skl2onnx==1.17.0 onnxruntime==1.20.1
python3 scripts/train_and_export.py
```

### 2. Build and Start Infrastructure
Build the Java/Python/Node containers and start the Kafka/Redis/Postgres ecosystem:
```bash
chmod +x scripts/build-all.sh
./scripts/build-all.sh
docker compose -f infra/docker-compose.yml up -d
```
*(Wait a moment for Kafka and PostgreSQL to become fully healthy).*

### 3. Seed the Feature Store
Pre-populate the Redis feature store to avoid cold-start cache misses during search:
```bash
pip install redis
python3 scripts/seed_redis_features.py
```

### 4. Access the Platform
- **Frontend UI:** [http://localhost:5173](http://localhost:5173) (if running via `npm run dev`) or check Docker mappings.
- **API Gateway:** [http://localhost:8080](http://localhost:8080)
- **Kafka UI (Kafdrop):** [http://localhost:9000](http://localhost:9000)

---

## 🧪 Testing & Validation

### Circuit Breaker Chaos Testing
To prove the Resilience4j fallback path works within the strict latency budget, run the chaos test. This script artificially pauses the ML container, fires requests to trip the circuit OPEN, verifies the fallback latency, and then unpauses the container to ensure it heals to CLOSED.
```bash
chmod +x scripts/chaos_test_circuit_breaker.sh
./scripts/chaos_test_circuit_breaker.sh
```

### Load Testing
Validate the `p95 < 35ms` SLA at 3,000 QPS using k6:
```bash
k6 run -e BASE_URL=http://localhost:8080 -e ML_BASE_URL=http://localhost:8084 tests/load/search-and-click.k6.js
```

---

## 🔒 Production & CI/CD
- **Kubernetes:** Production deployment manifests are available in `infra/k8s/`.
- **CI/CD:** GitHub Actions workflows (`.github/workflows/`) enforce Trivy security scans, SBOM generation, and multi-arch Docker builds on PRs.
- **Observability:** Metrics are exposed via Prometheus endpoints `/actuator/prometheus` on all Spring Boot services, ready for Grafana scraping.
