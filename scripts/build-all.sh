#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

build_image() {
  local name="$1"
  local path="$2"
  echo "=== Building ${name} ==="
  docker build -t "$3" "$ROOT_DIR/$path"
}

build_image "ClickRank Backend" "services/clickrank-backend" "clickrank-service:latest"
build_image "API Gateway" "services/api-gateway" "clickrank-api-gateway:latest"
build_image "Analytics Service" "services/analytics-service" "clickrank-analytics-service:latest"
build_image "ML Ranking Service" "services/ml-ranking-service" "clickrank-ml-service:latest"
build_image "Frontend (Vite/React)" "apps/frontend" "clickrank-frontend:latest"

echo "=== All Images Built Successfully! ==="
