#!/bin/bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
TEST_FILE="tests/load/search-and-click.k6.js"
AUTO_START_STACK="${AUTO_START_STACK:-true}"
COMPOSE_FILE="infra/docker-compose.yml"

if ! command -v k6 >/dev/null 2>&1; then
  echo "✗ k6 is not installed. Install from https://k6.io/docs/get-started/installation/"
  exit 1
fi

echo "Running load test against ${BASE_URL}"

if ! curl -fsS "${BASE_URL}/actuator/health" >/dev/null; then
  if [ "$AUTO_START_STACK" = "true" ] && command -v docker >/dev/null 2>&1; then
    echo "Gateway not reachable. Attempting to start local stack..."
    docker compose -f "$COMPOSE_FILE" up -d
    echo "Waiting 30s for services to warm up..."
    sleep 30
  fi
fi

if ! curl -fsS "${BASE_URL}/actuator/health" >/dev/null; then
  echo "✗ Preflight failed: ${BASE_URL}/actuator/health is not reachable."
  echo "  Start services first (example: docker compose -f ${COMPOSE_FILE} up -d)."
  exit 1
fi

echo "✓ Gateway health endpoint reachable"

if [ -n "$AUTH_TOKEN" ]; then
  echo "Using AUTH_TOKEN for authenticated load test traffic."
fi

k6 run -e BASE_URL="$BASE_URL" -e AUTH_TOKEN="$AUTH_TOKEN" "$TEST_FILE"
