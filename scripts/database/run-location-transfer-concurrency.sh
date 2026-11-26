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

cleanup_file="supabase/tests/database/location_transfer_concurrency_cleanup.sql"
cleanup() {
  run_sql < "$cleanup_file" >/dev/null 2>&1 || true
  rm -f "${output_a:-}" "${output_b:-}"
}
trap cleanup EXIT

wait_for_lock() {
  local application_name="$1"
  for attempt in {1..100}; do
    if docker exec "$database_container" psql -U postgres -d postgres -Atc \
      "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name = '$application_name' AND state = 'active' AND wait_event_type = 'Lock')" | grep -qx t; then
      return 0
    fi
    sleep 0.1
  done
  return 1
}

wait_for_sleep() {
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

run_sql < "$cleanup_file"
run_sql < supabase/tests/database/location_transfer_concurrency_setup.sql
output_a="$(mktemp)"
output_b="$(mktemp)"

# Classification commits first. The transfer must wait on the destination's
# policy row, then reject using its newly committed incompatible classification.
classify_first="BEGIN; UPDATE public.inventory_locations SET location_use='prepared_ingredient' WHERE id='ed100000-0000-4000-8000-000000000002'; SELECT pg_sleep(2); COMMIT;"
docker exec -e PGAPPNAME=location-transfer-policy-first-a "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$classify_first" > "$output_a" 2>&1 &
session_a=$!
if ! wait_for_sleep location-transfer-policy-first-a; then
  echo "La reclasificación inicial no retuvo el cambio para la prueba de concurrencia." >&2
  cat "$output_a" >&2
  wait "$session_a" || true
  exit 1
fi

transfer_after_classification="SET request.jwt.claim.sub='ed000000-0000-4000-8000-000000000001'; SELECT public.transfer_raw_material_lot_location('ed400000-0000-4000-8000-000000000001','ed100000-0000-4000-8000-000000000002','Reject transfer after incompatible location policy commits','ed500000-0000-4000-8000-000000000001');"
docker exec -e PGAPPNAME=location-transfer-policy-first-b "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$transfer_after_classification" > "$output_b" 2>&1 &
session_b=$!
if ! wait_for_lock location-transfer-policy-first-b; then
  echo "El traslado no esperó a que terminara la reclasificación de su destino." >&2
  cat "$output_b" >&2
  wait "$session_a" || true
  wait "$session_b" || true
  exit 1
fi
wait "$session_a"
if wait "$session_b"; then
  echo "El traslado aceptó la clasificación incompatible confirmada." >&2
  cat "$output_b" >&2
  exit 1
fi
if ! grep -Fq 'Source and destination must be distinct active locations compatible with the material.' "$output_b"; then
  echo "El traslado se rechazó por una causa distinta a la política actualizada:" >&2
  cat "$output_b" >&2
  exit 1
fi
run_sql <<'SQL'
DO $assert_policy_first$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_locations
    WHERE id = 'ed100000-0000-4000-8000-000000000002'
      AND location_use = 'prepared_ingredient'
      AND storage_condition = 'refrigerated' AND is_active
  ) OR NOT EXISTS (
    SELECT 1 FROM public.raw_material_lots
    WHERE id = 'ed400000-0000-4000-8000-000000000001'
      AND inventory_location_id = 'ed100000-0000-4000-8000-000000000001'
      AND status = 'available' AND quantity = 0.5000 AND remaining_value = 10
  ) OR EXISTS (
    SELECT 1 FROM public.inventory_movements
    WHERE reference_type = 'raw_material_lot_location_transfer'
      AND reference_id = 'ed500000-0000-4000-8000-000000000001'
  ) THEN
    RAISE EXCEPTION 'A transfer that waited for reclassification did not reject atomically against the committed location policy.';
  END IF;
END;
$assert_policy_first$;
SQL
docker exec "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "UPDATE public.inventory_locations SET location_use='raw_material' WHERE id='ed100000-0000-4000-8000-000000000002';"

# Transfer commits first while holding FOR SHARE. The location update must wait,
# observe the new physical lot and reject its incompatible reclassification.
transfer_first="BEGIN; SET LOCAL request.jwt.claim.sub='ed000000-0000-4000-8000-000000000001'; SELECT public.transfer_raw_material_lot_location('ed400000-0000-4000-8000-000000000001','ed100000-0000-4000-8000-000000000002','Transfer before incompatible location reclassification','ed500000-0000-4000-8000-000000000002'); SELECT pg_sleep(2); COMMIT;"
docker exec -e PGAPPNAME=location-transfer-first-a "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$transfer_first" > "$output_a" 2>&1 &
session_a=$!
if ! wait_for_sleep location-transfer-first-a; then
  echo "El traslado inicial no conservó los bloqueos de sus ubicaciones." >&2
  cat "$output_a" >&2
  wait "$session_a" || true
  exit 1
fi

reclassify_after_transfer="UPDATE public.inventory_locations SET location_use='prepared_ingredient' WHERE id='ed100000-0000-4000-8000-000000000002';"
docker exec -e PGAPPNAME=location-transfer-first-b "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$reclassify_after_transfer" > "$output_b" 2>&1 &
session_b=$!
if ! wait_for_lock location-transfer-first-b; then
  echo "La reclasificación no esperó a que terminara el traslado." >&2
  cat "$output_b" >&2
  wait "$session_a" || true
  wait "$session_b" || true
  exit 1
fi
wait "$session_a"
if wait "$session_b"; then
  echo "Se reclasificó una ubicación después de trasladar un lote comprado allí." >&2
  cat "$output_b" >&2
  exit 1
fi
if ! grep -Fq 'Location classification conflicts with physical raw-material lots stored there.' "$output_b"; then
  echo "La reclasificación se rechazó por una causa distinta al lote trasladado:" >&2
  cat "$output_b" >&2
  exit 1
fi

run_sql < supabase/tests/database/location_transfer_concurrency_assert.sql
echo "Concurrencia de traslado y reclasificación de ubicaciones: aprobada en ambos órdenes."
