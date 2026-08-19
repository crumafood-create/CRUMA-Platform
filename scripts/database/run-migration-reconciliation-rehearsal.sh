#!/usr/bin/env bash
set -euo pipefail

cruma_database='cruma_reconciliation_rehearsal'
cruma_host='127.0.0.1'
cruma_port='54322'
cruma_scheme='postgresql'
cruma_user='postgres'
cruma_password='postgres'
cruma_db_url="${cruma_scheme}://${cruma_user}:${cruma_password}@${cruma_host}:${cruma_port}/${cruma_database}"
cruma_evidence_dir="${CRUMA_REHEARSAL_EVIDENCE_DIR:-$(mktemp -d)}"
cruma_container=''

fail() {
  printf 'REHEARSAL_FAILED=%s\n' "$1" >&2
  exit 1
}

resolve_container() {
  docker ps --format '{{.Names}}' |
    awk '/^supabase_db_/ { print; exit }'
}

run_admin_sql() {
  docker exec "$cruma_container" psql -X -U postgres -d postgres \
    -v ON_ERROR_STOP=1 -c "$1"
}

drop_rehearsal_database() {
  run_admin_sql "select pg_terminate_backend(pid) from pg_stat_activity where datname = '$cruma_database';" >/dev/null
  run_admin_sql "drop database if exists $cruma_database;" >/dev/null
}

cleanup() {
  if [[ -n "$cruma_container" ]]; then
    drop_rehearsal_database >/dev/null 2>&1 || true
  fi
}

apply_sql_file() {
  docker exec -i "$cruma_container" psql -X -U postgres \
    -d "$cruma_database" -v ON_ERROR_STOP=1 < "$1"
}

dump_public_schema() {
  docker exec "$cruma_container" pg_dump -U postgres --schema-only \
    --schema=public --no-owner --no-privileges \
    --restrict-key=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef "$1"
}

trap cleanup EXIT
cruma_container="$(resolve_container)"
[[ -n "$cruma_container" ]] || fail 'LOCAL_DATABASE_CONTAINER_MISSING'
node scripts/database/assert-disposable-database.ts "$cruma_db_url"
mkdir -p "$cruma_evidence_dir"
chmod 700 "$cruma_evidence_dir"

drop_rehearsal_database
run_admin_sql "create database $cruma_database;" >/dev/null
apply_sql_file supabase/rehearsal/auth-contract.sql >/dev/null
apply_sql_file supabase/migrations/20260801000000_required_extensions.sql >/dev/null
apply_sql_file supabase/migrations/20260802000000_schema_baseline.sql >/dev/null

cruma_ledger_before="$(docker exec "$cruma_container" psql -X -U postgres \
  -d "$cruma_database" -Atqc "select to_regclass('supabase_migrations.schema_migrations') is null;")"
[[ "$cruma_ledger_before" == 't' ]] || fail 'LEDGER_WAS_NOT_ABSENT'

pnpm exec supabase migration repair 20260801000000 20260802000000 \
  --status applied --db-url "$cruma_db_url" --yes \
  > "$cruma_evidence_dir/repair.txt"
pnpm exec supabase db push --db-url "$cruma_db_url" --yes \
  > "$cruma_evidence_dir/push.txt"
pnpm exec supabase migration list --db-url "$cruma_db_url" \
  > "$cruma_evidence_dir/migration-list.txt"

cruma_remote_count="$(docker exec "$cruma_container" psql -X -U postgres \
  -d "$cruma_database" -Atqc 'select count(*) from supabase_migrations.schema_migrations;')"
[[ "$cruma_remote_count" == '7' ]] || fail 'REMOTE_VERSION_COUNT_MISMATCH'

dump_public_schema postgres > "$cruma_evidence_dir/reference-public.sql"
dump_public_schema "$cruma_database" > "$cruma_evidence_dir/rehearsal-public.sql"
cmp -s "$cruma_evidence_dir/reference-public.sql" \
  "$cruma_evidence_dir/rehearsal-public.sql" || fail 'PUBLIC_SCHEMA_DRIFT_DETECTED'

if grep -Eq 'sbp_|SUPABASE_ACCESS_TOKEN|SERVICE_ROLE_KEY|JWT_SECRET|YOUR-PASSWORD' \
  "$cruma_evidence_dir"/*; then
  fail 'EVIDENCE_SECRET_SCAN_FAILED'
fi

printf 'REHEARSAL_STATUS=OK\n'
printf 'LEDGER_BEFORE=ABSENT\n'
printf 'REMOTE_VERSION_COUNT=%s\n' "$cruma_remote_count"
printf 'PUBLIC_SCHEMA_MATCH=OK\n'
printf 'PUBLIC_SCHEMA_SHA256='
sha256sum "$cruma_evidence_dir/rehearsal-public.sql" | awk '{ print $1 }'
printf 'EVIDENCE_DIR=%s\n' "$cruma_evidence_dir"
