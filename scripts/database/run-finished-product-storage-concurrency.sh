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

cleanup_file="supabase/tests/database/finished_product_storage_concurrency_cleanup.sql"
cleanup() { run_sql < "$cleanup_file" >/dev/null 2>&1 || true; }
trap cleanup EXIT
run_sql < supabase/tests/database/finished_product_storage_concurrency_setup.sql

output_a="$(mktemp)"
output_b="$(mktemp)"
wait_for_lock() {
  local application_name="$1"
  for attempt in {1..100}; do
    if docker exec "$database_container" psql -U postgres -d postgres -Atc \
      "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name = '$application_name' AND state = 'active' AND query LIKE '%pg_sleep(2)%')" | grep -qx t; then
      return 0
    fi
    sleep 0.1
  done
  return 1
}

freeze_then_sleep="BEGIN; SET LOCAL request.jwt.claim.sub = 'fe000000-0000-4000-8000-000000000001'; SELECT public.start_product_lot_freezing('fe800000-0000-4000-8000-000000000001', 30, 'Concurrency reservation protection', 'fed00000-0000-4000-8000-000000000001'); SELECT pg_sleep(2); COMMIT;"
docker exec -e PGAPPNAME=storage-freeze-reservation-a "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$freeze_then_sleep" > "$output_a" 2>&1 &
session_a=$!
if ! wait_for_lock storage-freeze-reservation-a; then
  echo "La operación de congelación no conservó el bloqueo de producto durante la espera." >&2
  cat "$output_a" >&2
  wait "$session_a" || true
  exit 1
fi

confirm_order="SET request.jwt.claim.sub = 'fe000000-0000-4000-8000-000000000002'; SELECT public.confirm_sales_order('fea00000-0000-4000-8000-000000000001');"
if docker exec "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$confirm_order" > "$output_b" 2>&1; then
  echo "La reserva concurrente comprometió inventario ya apartado para congelación." >&2
  cat "$output_b" >&2
  wait "$session_a" || true
  exit 1
fi
wait "$session_a"
if ! grep -Fq 'Stock insuficiente para producto' "$output_b"; then
  echo "La reserva concurrente falló por una causa distinta al saldo protegido:" >&2
  cat "$output_b" >&2
  exit 1
fi

run_sql <<'SQL'
SET request.jwt.claim.sub = 'fe000000-0000-4000-8000-000000000001';
SELECT public.resolve_product_lot_freezing(
  operation.id, 30, 'raw_frozen', false,
  'First concurrency scenario completed',
  'fed00000-0000-4000-8000-000000000002'
)
FROM public.product_lot_freezing_operations AS operation
WHERE operation.idempotency_key = 'fed00000-0000-4000-8000-000000000001';
SQL

freeze_ten="BEGIN; SET LOCAL request.jwt.claim.sub = 'fe000000-0000-4000-8000-000000000001'; SELECT public.start_product_lot_freezing('fe800000-0000-4000-8000-000000000001', 10, 'Concurrent freezing operator A', 'fed00000-0000-4000-8000-000000000003'); SELECT pg_sleep(2); COMMIT;"
freeze_ten_b="BEGIN; SET LOCAL request.jwt.claim.sub = 'fe000000-0000-4000-8000-000000000002'; SELECT public.start_product_lot_freezing('fe800000-0000-4000-8000-000000000001', 10, 'Concurrent freezing operator B', 'fed00000-0000-4000-8000-000000000004'); COMMIT;"
docker exec -e PGAPPNAME=storage-freeze-two-a "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$freeze_ten" > "$output_a" 2>&1 &
session_a=$!
if ! wait_for_lock storage-freeze-two-a; then
  echo "La primera sesión de congelación no mantuvo el bloqueo del producto." >&2
  cat "$output_a" >&2
  wait "$session_a" || true
  exit 1
fi
if docker exec "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$freeze_ten_b" > "$output_b" 2>&1; then
  echo "Dos congelaciones apartaron más piezas frescas de las disponibles." >&2
  cat "$output_b" >&2
  wait "$session_a" || true
  exit 1
fi
wait "$session_a"
if ! grep -Fq 'Insufficient fresh availability' "$output_b"; then
  echo "La segunda congelación falló por una causa distinta al saldo insuficiente:" >&2
  cat "$output_b" >&2
  exit 1
fi

run_sql < supabase/tests/database/finished_product_storage_concurrency_assert.sql
rm -f "$output_a" "$output_b"
echo "Concurrencia de congelación y reservas por condición: aprobada."
