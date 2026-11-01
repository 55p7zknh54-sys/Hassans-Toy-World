#!/usr/bin/env bash
# Tests supabase/schema.sql + seed.sql on a throw-away local PostgreSQL (15+). Needs the Postgres
# binaries (initdb, pg_ctl, psql). Usage:  npm run test:db     (optionally PGBIN=/path/to/bin)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || PGBIN="$(dirname "$(command -v initdb)")"
PORT="${PGPORT:-54329}"
WORK="$(mktemp -d)"

RUN=""
if [ "$(id -u)" = "0" ]; then RUN="runuser -u postgres --"; chown postgres "$WORK"; fi

cleanup() { $RUN "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

$RUN "$PGBIN/initdb" -D "$WORK/data" -A trust -U postgres -E UTF8 --locale=C.UTF-8 >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null

PSQL=("$PGBIN/psql" -h "$WORK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -d postgres -c 'create database toyshop_test'
SEED=tests/db/seed-with-samples.sql
node "$ROOT/scripts/generate-seed-sql.mjs" --with-samples "$ROOT/$SEED" >/dev/null
for f in tests/db/stub.sql supabase/schema.sql "$SEED" tests/db/test.sql; do
  echo "→ $f"
  "${PSQL[@]}" -d toyshop_test -f "$ROOT/$f"
done
echo "DB TESTS PASSED"
