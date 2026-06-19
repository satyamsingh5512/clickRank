# ClickRank API Contract Examples

## 1) Ingest clickstream event

Endpoint: `POST /api/clicks`

```bash
curl -X POST 'http://localhost:8080/api/clicks' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <JWT_TOKEN>' \
  -d '{
    "userId": "user-42",
    "itemId": "item-991",
    "timestamp": "2026-04-14T12:05:22Z"
  }'
```

Expected response:

```json
{
  "status": "accepted",
  "eventId": "2f45c77b-0bc4-4f23-b7a5-03fc8aa8c709",
  "topic": "clickstream-events"
}
```

## 2) Rank items via ML service

Endpoint: `POST /rank`

```bash
curl -X POST 'http://localhost:8084/rank' \
  -H 'Content-Type: application/json' \
  -d '{
    "items": [
      { "item_id": "item-991", "ctr": 0.21, "recency_hours": 2.5 },
      { "item_id": "item-115", "ctr": 0.13, "recency_hours": 0.7 },
      { "item_id": "item-440", "ctr": 0.07, "recency_hours": 0.2 }
    ],
    "user_context": {
      "user_id": "user-42",
      "segment": "power",
      "intent": "buy"
    }
  }'
```

Expected response:

```json
{
  "ranked_items": [
    { "item_id": "item-991", "score": 0.74 },
    { "item_id": "item-115", "score": 0.55 },
    { "item_id": "item-440", "score": 0.36 }
  ],
  "ranked_at": "2026-04-14T12:07:55.123456+00:00"
}
```

## Frontend usage

- `src/services/api.ts` exposes:
  - `ingestClickstreamEvent(payload)`
  - `rankItems(payload)`
