#!/bin/bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-prod-clickrank}"
SECRET_NAME="clickrank-secrets"

require_var() {
  local var_name="$1"
  if [ -z "${!var_name:-}" ]; then
    echo "✗ Missing required env var: $var_name"
    exit 1
  fi
}

echo "=== ClickRank Kubernetes Production Bootstrap ==="

echo "Checking required secret env vars..."
require_var DB_PASSWORD
require_var REDIS_PASSWORD
require_var OAUTH2_ISSUER_URI
require_var POSTGRES_URL

echo "Ensuring namespace exists: $NAMESPACE"
kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE"

echo "Applying/refreshing secret: $SECRET_NAME"
kubectl -n "$NAMESPACE" create secret generic "$SECRET_NAME" \
  --from-literal=DB_PASSWORD="$DB_PASSWORD" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
  --from-literal=OAUTH2_ISSUER_URI="$OAUTH2_ISSUER_URI" \
  --from-literal=POSTGRES_URL="$POSTGRES_URL" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Deploying production overlay"
kubectl apply -k infra/k8s/overlays/production

echo "Waiting for deployments to roll out"
kubectl -n "$NAMESPACE" rollout status deploy/clickrank-deployment --timeout=180s
kubectl -n "$NAMESPACE" rollout status deploy/api-gateway-deployment --timeout=180s
kubectl -n "$NAMESPACE" rollout status deploy/frontend-deployment --timeout=180s
kubectl -n "$NAMESPACE" rollout status deploy/ml-ranking-service --timeout=180s

echo "=== Bootstrap complete ==="
kubectl -n "$NAMESPACE" get deploy,po,svc,ingress
