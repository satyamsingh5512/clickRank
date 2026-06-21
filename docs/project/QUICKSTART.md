# ClickRank Quick Start Guide

## One-Command Setup

```bash
# Fix Docker permissions (first time only)
sudo usermod -aG docker $USER && newgrp docker

# Build and start everything
./build-all.sh && docker compose up -d

# Wait 30 seconds, then test
sleep 30 && ./test-system.sh
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React UI |
| API Gateway | http://localhost:8080 | Entry point |
| Backend | http://localhost:8081 | Main service |
| Analytics | http://localhost:8083 | Stream processing |
| ML Service | http://localhost:8084 | ML ranking |
| Kafka UI | http://localhost:9000 | Kafdrop |

## Quick Tests

```bash
# Record a click
curl -X POST http://localhost:8081/api/click \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","query":"iphone","resultId":"r1","sessionId":"s1"}'

# Search
curl "http://localhost:8081/api/search?q=iphone"

# Trending
curl "http://localhost:8081/api/search/trending"

# ML Score
curl -X POST "http://localhost:8084/api/ml/score?query=iphone&resultId=r1"
```

## Common Commands

```bash
# View logs
docker compose logs -f [service-name]

# Restart service
docker compose restart [service-name]

# Stop all
docker compose down

# Clean restart
docker compose down -v && docker compose up -d
```

## Troubleshooting

**Build fails?**
```bash
./verify-build.sh  # Check prerequisites
rm -rf ~/.m2/repository  # Clear Maven cache
```

**Services won't start?**
```bash
docker compose logs [service-name]  # Check logs
docker compose restart [service-name]  # Restart
```

**Port conflicts?**
```bash
sudo lsof -i :[port]  # Find process
sudo kill -9 [PID]  # Kill process
```

## Architecture

```
User → Frontend (3000) → Gateway (8080) → Backend (8081)
                                        ↓
                                    Kafka (9092)
                                        ↓
                                Analytics (8083)
                                        ↓
                            Redis (6379) + PostgreSQL (5432)
                                        ↑
                                ML Service (8084)
```

## Development Mode

Run services locally without Docker:

```bash
# Start infrastructure only
cd clickrank-backend && docker compose up -d && cd ..

# Run each service in separate terminals
cd clickrank-backend && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run
cd analytics-service && mvn spring-boot:run
cd ml-ranking-service && mvn spring-boot:run
npm run dev  # Frontend
```

## Need Help?

- Full guide: See `RUNNING.md`
- Fixes applied: See `FIXES_APPLIED.md`
- Prerequisites: Run `./verify-build.sh`
