#!/usr/bin/env bash

set -euo pipefail

database_container="$(
  docker ps \
    --filter 'name=^/supabase_db_' \
    --format '{{.Names}}' \
    | head -1
)"

if [[ -z "$database_container" ]]; then
  echo "No se encontró un contenedor PostgreSQL local de Supabase." >&2
  exit 1
fi

run_sql() {
  docker exec -i "$database_container" \
    psql -U postgres -d postgres -v ON_ERROR_STOP=1
}

cleanup_file="supabase/tests/database/production_order_mass_reservation_concurrency_cleanup.sql"
cleanup() {
  run_sql < "$cleanup_file" >/dev/null 2>&1 || true
}
trap cleanup EXIT

run_sql < supabase/tests/database/production_order_mass_reservation_concurrency_setup.sql

start_a="BEGIN; SET LOCAL request.jwt.claim.sub = 'e1800000-0000-4000-8000-000000000001'; SELECT public.start_production_order_with_mass_lot_reservations((SELECT production_order_id FROM public.production_order_lifecycle_operations WHERE idempotency_key = 'e1860000-0000-4000-8000-000000000002'), '[{\"product_lot_id\":\"e1880000-0000-4000-8000-000000000001\",\"quantity\":1}]'::jsonb, 'e1860000-0000-4000-8000-000000000006'); SELECT pg_sleep(2); COMMIT;"
start_b="BEGIN; SET LOCAL request.jwt.claim.sub = 'e1800000-0000-4000-8000-000000000001'; SELECT public.start_production_order_with_mass_lot_reservations((SELECT production_order_id FROM public.production_order_lifecycle_operations WHERE idempotency_key = 'e1860000-0000-4000-8000-000000000003'), '[{\"product_lot_id\":\"e1880000-0000-4000-8000-000000000001\",\"quantity\":1}]'::jsonb, 'e1860000-0000-4000-8000-000000000007'); COMMIT;"

output_a="$(mktemp)"
output_b="$(mktemp)"
docker exec -e PGAPPNAME=mass-reservation-a "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$start_a" > "$output_a" 2>&1 &
session_a=$!

lock_held=false
for attempt in {1..100}; do
  if docker exec "$database_container" psql -U postgres -d postgres \
    -Atc "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name = 'mass-reservation-a' AND state = 'active' AND query LIKE '%pg_sleep(2)%')" \
    | grep -qx t
  then
    lock_held=true
    break
  fi
    sleep 0.1
done

if [[ "$lock_held" != true ]]; then
  echo "La primera sesión no alcanzó el punto de espera conservando el bloqueo del lote." >&2
  cat "$output_a" >&2
  wait "$session_a" || true
  rm -f "$output_a" "$output_b"
  exit 1
fi

if docker exec "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$start_b" > "$output_b" 2>&1
then
  echo "La segunda orden consumió masa que ya no estaba disponible." >&2
  cat "$output_b" >&2
  wait "$session_a" || true
  rm -f "$output_a" "$output_b"
  exit 1
fi

wait "$session_a"
if ! grep -Fq "El peso retirado supera la cantidad disponible del lote." "$output_b"; then
  echo "La segunda transacción falló por una causa distinta al saldo insuficiente:" >&2
  cat "$output_b" >&2
  rm -f "$output_a" "$output_b"
  exit 1
fi

run_sql < supabase/tests/database/production_order_mass_reservation_concurrency_assert.sql
rm -f "$output_a" "$output_b"
echo "Concurrencia de apartado por lote: aprobada."
