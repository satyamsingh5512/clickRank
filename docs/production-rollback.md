# Production Rollback Runbook

This runbook covers safe rollback procedures for ClickRank in Kubernetes and Docker Compose deployments.

## 1. Rollback Triggers

Use rollback when one or more of these happen after deploy:
- sustained 5xx increase above normal baseline
- p95 latency regression beyond SLO
- high pod restart frequency or crash loops
- major feature path broken (search/click/rank)

## 2. Fast Triage (5 minutes)

```bash
kubectl -n prod-clickrank get pods
kubectl -n prod-clickrank get events --sort-by=.metadata.creationTimestamp | tail -n 30
kubectl -n prod-clickrank logs deploy/api-gateway-deployment --tail=150
kubectl -n prod-clickrank logs deploy/clickrank-deployment --tail=150
```

If impact is high and clear, start rollback immediately.

## 3. Kubernetes Rollback

### 3.1 Check rollout history

```bash
kubectl -n prod-clickrank rollout history deploy/clickrank-deployment
kubectl -n prod-clickrank rollout history deploy/api-gateway-deployment
kubectl -n prod-clickrank rollout history deploy/frontend-deployment
kubectl -n prod-clickrank rollout history deploy/ml-ranking-service
```

### 3.2 Roll back one service

```bash
kubectl -n prod-clickrank rollout undo deploy/clickrank-deployment
```

### 3.3 Roll back to a specific revision

```bash
kubectl -n prod-clickrank rollout undo deploy/clickrank-deployment --to-revision=<REVISION>
```

### 3.4 Roll back all app deployments

```bash
kubectl -n prod-clickrank rollout undo deploy/api-gateway-deployment
kubectl -n prod-clickrank rollout undo deploy/clickrank-deployment
kubectl -n prod-clickrank rollout undo deploy/ml-ranking-service
kubectl -n prod-clickrank rollout undo deploy/frontend-deployment
```

### 3.5 Verify recovery

```bash
kubectl -n prod-clickrank rollout status deploy/api-gateway-deployment --timeout=180s
kubectl -n prod-clickrank rollout status deploy/clickrank-deployment --timeout=180s
kubectl -n prod-clickrank rollout status deploy/ml-ranking-service --timeout=180s
kubectl -n prod-clickrank rollout status deploy/frontend-deployment --timeout=180s
kubectl -n prod-clickrank get deploy,po
```

## 4. Docker Compose Rollback

Use this when running the production-like Docker deployment.

### 4.1 Roll back by image tag

1. Update image tags in compose files to a known-good release/tag.
2. Redeploy:

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.prod.yml up -d
./scripts/test-system.sh
```

### 4.2 Emergency full restart

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.prod.yml down
docker compose -f infra/docker-compose.yml -f infra/docker-compose.prod.yml up -d
./scripts/test-system.sh
```

## 5. Post-Rollback Checklist

- Confirm `/actuator/health` and `/health` endpoints are healthy.
- Validate key flows: search, click ingestion, trending, ML ranking.
- Check error rates and latency against baseline.
- Capture incident notes: trigger, timeline, root cause hypothesis, follow-ups.

## 6. Prevention Follow-up

- Add regression test for the failure mode.
- Add alert if one was missing.
- Add release guard in CI/CD for this class of issue.
