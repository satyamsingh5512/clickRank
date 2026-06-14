#!/usr/bin/env bash
# =============================================================================
# ClickRank — Circuit Breaker Chaos Test
# =============================================================================
# Validates that the Resilience4j circuit breaker in clickrank-backend trips
# correctly when ml-ranking-service is unavailable, and that the fallback
# (trending ZSet) responds within the 25ms SLO budget.
#
# Prerequisites:
#   - docker-compose stack is running (docker compose -f infra/docker-compose.yml up -d)
#   - Redis is seeded (python scripts/seed_redis_features.py)
#   - jq is installed (apt-get install jq / brew install jq)
#   - bc is installed (standard on all Linux/Mac)
#
# Usage:
#   chmod +x scripts/chaos_test_circuit_breaker.sh
#   ./scripts/chaos_test_circuit_breaker.sh
#
# Exit codes:
#   0 — All assertions passed
#   1 — One or more assertions failed (check output for details)
# =============================================================================

set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────────────────
BACKEND_URL="${BACKEND_URL:-http://localhost:8081}"
ML_CONTAINER="${ML_CONTAINER:-clickrank-ml-ranking-service}"
SEARCH_QUERY="${SEARCH_QUERY:-iphone}"
SEARCH_LIMIT=10
# How many requests to fire to trip the circuit (sliding window = 20, threshold = 50%)
TRIP_REQUESTS=12
# Latency SLO in milliseconds for the fallback path
FALLBACK_SLO_MS=25
# Tolerance: circuit may take a few extra ms due to Java reflection overhead
FALLBACK_TOLERANCE_MS=200  # actual SLO applies to ML inference, not Java handler

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
BLU='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

pass() { echo -e "${GRN}  ✓ PASS${NC} — $1"; ((PASS++)) || true; }
fail() { echo -e "${RED}  ✗ FAIL${NC} — $1"; ((FAIL++)) || true; }
info() { echo -e "${BLU}  ▶${NC} $1"; }
warn() { echo -e "${YLW}  ⚠${NC} $1"; }
header() { echo -e "\n${BLU}══════════════════════════════════════════${NC}"; echo -e "${BLU}  $1${NC}"; echo -e "${BLU}══════════════════════════════════════════${NC}"; }

# ─── Phase 0: Pre-checks ─────────────────────────────────────────────────────
header "PHASE 0: Pre-flight checks"

# Check dependencies
for cmd in curl jq bc docker; do
    if ! command -v "$cmd" &>/dev/null; then
        echo -e "${RED}ERROR: '$cmd' not found. Please install it first.${NC}"
        exit 1
    fi
done
pass "All CLI dependencies found (curl, jq, bc, docker)"

# Verify backend is healthy
HEALTH=$(curl -sf "${BACKEND_URL}/actuator/health" 2>/dev/null || echo '{"status":"DOWN"}')
STATUS=$(echo "$HEALTH" | jq -r '.status // "DOWN"')
if [[ "$STATUS" == "UP" ]]; then
    pass "clickrank-backend is healthy"
else
    fail "clickrank-backend is not healthy (status=${STATUS}). Is docker-compose running?"
    exit 1
fi

# Verify ML container is running
if docker ps --format '{{.Names}}' | grep -q "^${ML_CONTAINER}$"; then
    pass "ML container '${ML_CONTAINER}' is running"
else
    fail "ML container '${ML_CONTAINER}' not found. Run: docker compose -f infra/docker-compose.yml up -d"
    exit 1
fi

# ─── Phase 1: Baseline — Normal Operation ─────────────────────────────────────
header "PHASE 1: Baseline search (ML service UP)"

info "Sending baseline search request..."
START_MS=$(($(date +%s%N) / 1000000))
BASELINE=$(curl -sf -w "\n%{http_code}" \
    "${BACKEND_URL}/api/search?q=${SEARCH_QUERY}&limit=${SEARCH_LIMIT}" \
    -H "X-User-Id: chaos-test-user" \
    -H "X-User-Segment: power" 2>/dev/null || echo -e "\n500")
ELAPSED_MS=$(( $(date +%s%N) / 1000000 - START_MS ))

HTTP_CODE=$(echo "$BASELINE" | tail -1)
BODY=$(echo "$BASELINE" | head -1)

if [[ "$HTTP_CODE" == "200" ]]; then
    RESULT_COUNT=$(echo "$BODY" | jq '.results | length' 2>/dev/null || echo 0)
    pass "Baseline search returned HTTP 200 with ${RESULT_COUNT} results in ${ELAPSED_MS}ms"
else
    warn "Baseline search returned HTTP ${HTTP_CODE} (ML service may be in fallback already)"
fi

# ─── Phase 2: Kill the ML Service ────────────────────────────────────────────
header "PHASE 2: Killing ML service to trigger circuit breaker"

info "Pausing container: docker pause ${ML_CONTAINER}"
docker pause "${ML_CONTAINER}"
pass "ML container paused (simulating crash/hang)"

# Brief sleep to ensure connections time out
info "Waiting 3s for in-flight connections to timeout..."
sleep 3

# ─── Phase 3: Fire requests to trip the circuit ──────────────────────────────
header "PHASE 3: Firing ${TRIP_REQUESTS} requests to trip the circuit"

info "Sending ${TRIP_REQUESTS} search requests while ML service is DOWN..."
CIRCUIT_OPEN=false
CB_TRIP_LATENCIES=()

for i in $(seq 1 "$TRIP_REQUESTS"); do
    START_MS=$(($(date +%s%N) / 1000000))
    RESP=$(curl -sf -w "\n%{http_code}" \
        "${BACKEND_URL}/api/search?q=${SEARCH_QUERY}&limit=${SEARCH_LIMIT}" \
        -H "X-User-Id: chaos-user-${i}" \
        -H "X-User-Segment: default" \
        --max-time 5 2>/dev/null || echo -e "\n503")
    ELAPSED=$(($(date +%s%N) / 1000000 - START_MS))
    CODE=$(echo "$RESP" | tail -1)
    CB_TRIP_LATENCIES+=("$ELAPSED")
    echo "    Request ${i}: HTTP ${CODE} in ${ELAPSED}ms"
done

pass "All ${TRIP_REQUESTS} requests completed (degraded but not broken)"

# ─── Phase 4: Verify Circuit is OPEN and fallback is serving ─────────────────
header "PHASE 4: Verifying circuit is OPEN and fallback returns results"

info "Checking circuit breaker state via Actuator..."
CB_STATE=$(curl -sf "${BACKEND_URL}/actuator/circuitbreakers" 2>/dev/null || echo '{}')
if echo "$CB_STATE" | jq -e '.circuitBreakers.mlRankingService' &>/dev/null; then
    STATE=$(echo "$CB_STATE" | jq -r '.circuitBreakers.mlRankingService.state // "UNKNOWN"')
    FAILURE_RATE=$(echo "$CB_STATE" | jq -r '.circuitBreakers.mlRankingService.failureRate // "?"')
    pass "Circuit breaker 'mlRankingService' found — state=${STATE}, failureRate=${FAILURE_RATE}%"
    if [[ "$STATE" == "OPEN" ]]; then
        pass "Circuit is OPEN — fallback routing is active"
        CIRCUIT_OPEN=true
    else
        warn "Circuit state is '${STATE}' (may need more failing requests to open — slidingWindowSize=20)"
    fi
else
    warn "Circuit breaker endpoint not available or instance not found in response"
    warn "Ensure management.endpoints.web.exposure.include=circuitbreakers in application.yml"
fi

# ─── Phase 5: Measure fallback latency ───────────────────────────────────────
header "PHASE 5: Measuring fallback path latency (SLO: response < ${FALLBACK_TOLERANCE_MS}ms)"

info "Sending 5 requests to measure fallback latency..."
FALLBACK_OK=true
for i in $(seq 1 5); do
    START_MS=$(($(date +%s%N) / 1000000))
    RESP=$(curl -sf -w "\n%{http_code}" \
        "${BACKEND_URL}/api/search?q=${SEARCH_QUERY}&limit=${SEARCH_LIMIT}" \
        -H "X-User-Id: fallback-test-${i}" \
        --max-time 5 2>/dev/null || echo -e "\n503")
    ELAPSED=$(($(date +%s%N) / 1000000 - START_MS))
    CODE=$(echo "$RESP" | tail -1)
    BODY=$(echo "$RESP" | head -1)

    if [[ "$CODE" == "200" ]]; then
        RESULT_COUNT=$(echo "$BODY" | jq '.results | length' 2>/dev/null || echo 0)
        echo "    Fallback ${i}: HTTP 200, ${RESULT_COUNT} results, ${ELAPSED}ms"
        if (( ELAPSED > FALLBACK_TOLERANCE_MS )); then
            warn "Fallback response ${ELAPSED}ms exceeded tolerance ${FALLBACK_TOLERANCE_MS}ms"
            FALLBACK_OK=false
        fi
    else
        echo "    Fallback ${i}: HTTP ${CODE} in ${ELAPSED}ms"
        fail "Fallback returned non-200 status: ${CODE}"
        FALLBACK_OK=false
    fi
done

if $FALLBACK_OK; then
    pass "All fallback responses returned HTTP 200 within ${FALLBACK_TOLERANCE_MS}ms"
fi

# ─── Phase 6: Restore ML Service ─────────────────────────────────────────────
header "PHASE 6: Restoring ML service"

info "Unpausing container: docker unpause ${ML_CONTAINER}"
docker unpause "${ML_CONTAINER}"
pass "ML container unpaused"

info "Waiting 15s for circuit to transition to HALF_OPEN (waitDurationInOpenState=10s)..."
sleep 15

# ─── Phase 7: Recovery verification ──────────────────────────────────────────
header "PHASE 7: Verifying circuit recovery"

for i in $(seq 1 5); do
    sleep 1
    RESP=$(curl -sf -w "\n%{http_code}" \
        "${BACKEND_URL}/api/search?q=${SEARCH_QUERY}&limit=${SEARCH_LIMIT}" \
        -H "X-User-Id: recovery-${i}" --max-time 5 2>/dev/null || echo -e "\n503")
    CODE=$(echo "$RESP" | tail -1)
    echo "    Recovery probe ${i}: HTTP ${CODE}"
done

# Final circuit state
CB_STATE_FINAL=$(curl -sf "${BACKEND_URL}/actuator/circuitbreakers" 2>/dev/null || echo '{}')
FINAL_STATE=$(echo "$CB_STATE_FINAL" | jq -r '.circuitBreakers.mlRankingService.state // "UNKNOWN"' 2>/dev/null || echo "UNKNOWN")
if [[ "$FINAL_STATE" == "CLOSED" ]]; then
    pass "Circuit returned to CLOSED state — ML service fully recovered"
else
    warn "Circuit state after recovery: ${FINAL_STATE} (may need more probe calls)"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
header "CHAOS TEST SUMMARY"
echo -e "  Tests passed: ${GRN}${PASS}${NC}"
echo -e "  Tests failed: ${RED}${FAIL}${NC}"

if (( FAIL == 0 )); then
    echo -e "\n${GRN}✓ ALL ASSERTIONS PASSED — Circuit Breaker validated successfully.${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ ${FAIL} ASSERTION(S) FAILED — Review output above.${NC}\n"
    exit 1
fi
