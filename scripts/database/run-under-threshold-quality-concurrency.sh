#!/usr/bin/env bash

set -euo pipefail

database_container="$(docker ps --filter 'name=^/supabase_db_' --format '{{.Names}}' | head -1)"
if [[ -z "$database_container" ]]; then
  echo "No se encontró un contenedor PostgreSQL local de Supabase." >&2
  exit 1
fi

run_sql() {
  docker exec -i "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1
}

cleanup_file="supabase/tests/database/under_threshold_quality_concurrency_cleanup.sql"
cleanup() { run_sql < "$cleanup_file" >/dev/null 2>&1 || true; }
trap cleanup EXIT
run_sql < "$cleanup_file" >/dev/null 2>&1 || true
run_sql < supabase/tests/database/under_threshold_quality_concurrency_setup.sql

output_a="$(mktemp)"
output_b="$(mktemp)"
wait_for_block() {
  for attempt in {1..100}; do
    if docker exec "$database_container" psql -U postgres -d postgres -Atc \
      "SELECT EXISTS (SELECT 1 FROM pg_stat_activity AS waiting WHERE waiting.application_name = 'quality-decision-race-b' AND waiting.state = 'active' AND cardinality(pg_blocking_pids(waiting.pid)) > 0)" | grep -qx t; then
      return 0
    fi
    sleep 0.1
  done
  return 1
}

decision_a="BEGIN; SET LOCAL request.jwt.claim.sub = 'f9100000-0000-4000-8000-000000000001'; SET LOCAL ROLE authenticated; SELECT public.decide_under_threshold_frozen_lot_quality('f9800000-0000-4000-8000-000000000001', 2, 2, 0, 0, true, true, 'folio=QA-RACE-A; fecha/hora=10:15; lectura=4 C; especificacion=2-5 C', 'Sin testigo por excepción autorizada por Calidad A.', 'Inspección completa aprobada por Calidad A.', 'f9900000-0000-4000-8000-000000000001'); RESET ROLE; SELECT pg_sleep(5); COMMIT;"
docker exec -e PGAPPNAME=quality-decision-race-a "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$decision_a" > "$output_a" 2>&1 &
session_a=$!

for attempt in {1..100}; do
  if docker exec "$database_container" psql -U postgres -d postgres -Atc \
    "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name = 'quality-decision-race-a' AND state = 'active' AND query LIKE '%pg_sleep(5)%')" | grep -qx t; then
    break
  fi
  sleep 0.1
done

decision_b="SET request.jwt.claim.sub = 'f9100000-0000-4000-8000-000000000002'; SET ROLE authenticated; SELECT public.decide_under_threshold_frozen_lot_quality('f9800000-0000-4000-8000-000000000001', 2, 2, 0, 0, true, true, 'folio=QA-RACE-B; fecha/hora=10:16; lectura=4 C; especificacion=2-5 C', 'Sin testigo por excepción autorizada por Calidad B.', 'Inspección completa aprobada por Calidad B.', 'f9900000-0000-4000-8000-000000000002');"
if docker exec -e PGAPPNAME=quality-decision-race-b "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$decision_b" > "$output_b" 2>&1 & then
  session_b=$!
else
  echo "No se pudo iniciar la segunda sesión de Calidad." >&2
  cat "$output_b" >&2
  wait "$session_a" || true
  exit 1
fi

if ! wait_for_block; then
  echo "La segunda decisión no quedó bloqueada por la primera; no se acredita concurrencia." >&2
  cat "$output_a" "$output_b" >&2
  wait "$session_a" || true
  wait "$session_b" || true
  exit 1
fi
wait "$session_a"
if wait "$session_b"; then
  echo "La segunda Calidad liberó otra vez las mismas piezas." >&2
  cat "$output_b" >&2
  exit 1
fi
if ! grep -Fq 'Inspect the entire under-threshold quantity currently held for Quality.' "$output_b"; then
  echo "La segunda decisión se rechazó por un motivo distinto al cambio de saldo esperado:" >&2
  cat "$output_b" >&2
  exit 1
fi

run_sql < supabase/tests/database/under_threshold_quality_concurrency_assert.sql
rm -f "$output_a" "$output_b"
echo "Decisiones concurrentes de Calidad sobre las mismas piezas: aprobadas."
