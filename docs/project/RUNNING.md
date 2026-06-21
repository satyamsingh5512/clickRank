# How to Run ClickRank Project

This guide provides step-by-step instructions to build and run the complete ClickRank microservices system.

## Prerequisites

- Docker and Docker Compose
- Java 17
- Maven 3.8+
- Node.js 20+ (for frontend)

## Quick Start (Recommended)

### Step 1: Fix Docker Permissions (Linux only)

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the new group membership
newgrp docker

# Verify Docker works without sudo
docker ps
```

### Step 2: Build All Docker Images

```bash
# Make the build script executable
chmod +x build-all.sh

# Build all services
./build-all.sh
```

This will build:
- clickrank-service (backend)
- clickrank-api-gateway
- clickrank-analytics-service
- clickrank-ml-service
- clickrank-frontend

### Step 3: Start All Services

```bash
# Start infrastructure and all microservices
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f
```

## Service Endpoints

Once running, the following services will be available:

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **ClickRank Backend**: http://localhost:8081
- **Analytics Service**: http://localhost:8083
- **ML Ranking Service**: http://localhost:8084
- **Kafka UI (Kafdrop)**: http://localhost:8080 (via Kafdrop container)
- **PostgreSQL**: localhost:5432 (user: clickrank, password: password)
- **Redis**: localhost:6379

## Testing the System

### 1. Record a Click Event

```bash
curl -X POST http://localhost:8081/api/click \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "query": "iphone",
    "resultId": "result42",
    "sessionId": "session99"
  }'
```

### 2. Get Ranked Search Results

```bash
curl "http://localhost:8081/api/search?q=iphone&limit=10"
```

### 3. Get Trending Queries

```bash
curl "http://localhost:8081/api/search/trending"
```

### 4. ML Service Score

```bash
curl -X POST "http://localhost:8084/api/ml/score?query=iphone&resultId=result42"
```

### 5. Health Checks

```bash
# Backend health
curl http://localhost:8081/actuator/health

# Gateway health
curl http://localhost:8080/actuator/health

# Analytics health
curl http://localhost:8083/actuator/health

# ML service health
curl http://localhost:8084/api/ml/health
```

## Alternative: Run Individual Services Locally

If you prefer to run services locally without Docker:

### 1. Start Infrastructure Only

```bash
cd clickrank-backend
docker compose up -d
cd ..
```

This starts: Zookeeper, Kafka, Redis, PostgreSQL

### 2. Run Backend Service

```bash
cd clickrank-backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 3. Run API Gateway

```bash
cd api-gateway
mvn spring-boot:run
```

### 4. Run Analytics Service

```bash
cd analytics-service
mvn spring-boot:run
```

### 5. Run ML Service

```bash
cd ml-ranking-service
mvn spring-boot:run
```

### 6. Run Frontend

```bash
npm install
npm run dev
```

## Troubleshooting

### Docker Permission Denied

If you get "permission denied" errors:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Port Already in Use

Check if ports are already occupied:
```bash
# Check specific port
sudo lsof -i :8080

# Kill process using port
sudo kill -9 <PID>
```

### Maven Build Failures

Clear Maven cache and rebuild:
```bash
rm -rf ~/.m2/repository
./build-all.sh
```

### Services Not Starting

Check logs:
```bash
docker compose logs <service-name>
```

Restart specific service:
```bash
docker compose restart <service-name>
```

## Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## Architecture Overview

```
┌─────────────┐
│  Frontend   │ :3000
└──────┬──────┘
       │
┌──────▼──────────┐
│  API Gateway    │ :8080
└──────┬──────────┘
       │
       ├─────────────────┬──────────────────┬────────────────┐
       │                 │                  │                │
┌──────▼──────┐  ┌───────▼────────┐  ┌─────▼─────┐  ┌──────▼──────┐
│  Backend    │  │   Analytics    │  │ ML Service│  │   Kafka     │
│  Service    │  │   Service      │  │           │  │             │
│  :8081      │  │   :8083        │  │  :8084    │  │  :9092      │
└─────────────┘  └────────────────┘  └───────────┘  └─────────────┘
       │                 │                  │
       └────────┬────────┴──────────────────┘
                │
       ┌────────▼────────┐
       │  Redis :6379    │
       │  PostgreSQL     │
       │  :5432          │
       └─────────────────┘
```

## Development Notes

- OAuth2 authentication is disabled by default for easier development
- Redis is configured in standalone mode (not cluster)
- All services use the `dev` profile by default
- Kafka Schema Registry is optional and disabled in dev mode
