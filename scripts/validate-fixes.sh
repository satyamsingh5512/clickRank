#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Validating Core Project Structure ==="
echo ""

ERRORS=0

check_file() {
  local path="$1"
  local label="$2"
  if [ -f "$ROOT_DIR/$path" ]; then
    echo "✓ $label"
  else
    echo "✗ $label"
    ERRORS=$((ERRORS + 1))
  fi
}

check_file "apps/frontend/package.json" "Frontend package.json exists"
check_file "apps/frontend/src/main.tsx" "Frontend app entry exists"
check_file "services/clickrank-backend/pom.xml" "ClickRank backend exists"
check_file "services/api-gateway/pom.xml" "API gateway exists"
check_file "services/analytics-service/pom.xml" "Analytics service exists"
check_file "services/ml-ranking-service/main.py" "ML ranking service exists"
check_file "infra/docker-compose.yml" "Unified docker compose exists"
check_file "scripts/build-all.sh" "Build script exists"
check_file "scripts/test-system.sh" "System test script exists"

if [ -d "$ROOT_DIR/services/clickrank-backend/target" ] || [ -d "$ROOT_DIR/services/api-gateway/target" ] || [ -d "$ROOT_DIR/services/analytics-service/target" ] || [ -d "$ROOT_DIR/services/ml-ranking-service/__pycache__" ]; then
  echo "✗ Generated artifacts still present in service directories"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ Generated artifacts are not present"
fi

echo ""
echo "=== Validation Complete ==="
if [ "$ERRORS" -eq 0 ]; then
  echo "✓ Structure is clean and consistent"
else
  echo "✗ Found $ERRORS issue(s)."
  exit 1
fi
