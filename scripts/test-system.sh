#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

echo "=== Testing ClickRank System ==="
echo ""

if docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
else
  echo "✗ Docker Compose not found (need docker compose or docker-compose)"
  exit 1
fi

if ! $COMPOSE_CMD -f "$COMPOSE_FILE" ps &> /dev/null; then
  echo "✗ Docker Compose is available but stack status could not be queried"
  exit 1
fi

if [ "$($COMPOSE_CMD -f "$COMPOSE_FILE" ps -q | wc -l)" -eq 0 ]; then
  echo "Stack is not running. Starting with: $COMPOSE_CMD -f $COMPOSE_FILE up -d"
  $COMPOSE_CMD -f "$COMPOSE_FILE" up -d
fi

echo "Waiting for services to start (30 seconds)..."
sleep 30

echo ""
echo "=== Testing Health Endpoints ==="

echo -n "Backend Health: "
curl -s http://localhost:8081/actuator/health | grep -q "UP" && echo "✓ UP" || echo "✗ DOWN"

echo -n "Gateway Health: "
curl -s http://localhost:8080/actuator/health | grep -q "UP" && echo "✓ UP" || echo "✗ DOWN"

echo -n "Analytics Health: "
curl -s http://localhost:8083/actuator/health | grep -q "UP" && echo "✓ UP" || echo "✗ DOWN"

echo -n "ML Service Health: "
curl -s http://localhost:8084/health | grep -qi '"status":"ok"' && echo "✓ UP" || echo "✗ DOWN"

echo ""
echo "=== Testing Click Ingestion ==="
CLICK_RESPONSE=$(curl -s -X POST http://localhost:8080/api/clicks \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","itemId":"result42","timestamp":"2026-01-01T00:00:00Z"}')

if [ -n "$CLICK_RESPONSE" ]; then
    echo "✓ Click ingestion successful"
else
    echo "✗ Click ingestion failed"
fi

echo ""
echo "=== Testing Search Ranking ==="
SEARCH_RESPONSE=$(curl -s "http://localhost:8080/api/search?q=iphone&limit=10")

if [ -n "$SEARCH_RESPONSE" ]; then
    echo "✓ Search ranking successful"
else
    echo "✗ Search ranking failed"
fi

echo ""
echo "=== Testing ML Service ==="
ML_RESPONSE=$(curl -s -X POST "http://localhost:8084/rank" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"item_id":"result42","ctr":0.18,"recency_hours":6.0},{"item_id":"result84","ctr":0.11,"recency_hours":12.0}],"user_context":{"user_id":"user123","segment":"returning","intent":"browse"}}')

if echo "$ML_RESPONSE" | grep -q "ranked_items"; then
  echo "✓ ML service successful"
else
  echo "✗ ML service failed"
fi

echo ""
echo "=== Testing Trending Queries ==="
TRENDING_RESPONSE=$(curl -s "http://localhost:8080/api/search/trending")

if [ -n "$TRENDING_RESPONSE" ]; then
    echo "✓ Trending queries successful"
else
    echo "✗ Trending queries failed"
fi

echo ""
echo "=== All Tests Complete ==="
