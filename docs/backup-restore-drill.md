# Backup and Restore Drill (PostgreSQL + Redis)

Run this drill at least once per release cycle.

## PostgreSQL Backup

```bash
docker exec -t clickrank-postgres pg_dump -U clickrank -d clickrank_db -Fc > /tmp/clickrank_db.dump
ls -lh /tmp/clickrank_db.dump
```

## PostgreSQL Restore Verification (to temp DB)

```bash
docker exec -it clickrank-postgres psql -U clickrank -c "CREATE DATABASE clickrank_restore_test;"
docker exec -i clickrank-postgres pg_restore -U clickrank -d clickrank_restore_test < /tmp/clickrank_db.dump
docker exec -it clickrank-postgres psql -U clickrank -d clickrank_restore_test -c "\\dt"
```

Cleanup:

```bash
docker exec -it clickrank-postgres psql -U clickrank -c "DROP DATABASE clickrank_restore_test;"
```

## Redis Persistence Verification

```bash
docker exec -it clickrank-redis redis-cli INFO persistence
```

Confirm:
- `rdb_last_bgsave_status:ok`
- AOF enabled if your policy requires it

## Recovery Validation

After restore, run:

```bash
./scripts/test-system.sh
```

Record results in your release notes/ops log.
