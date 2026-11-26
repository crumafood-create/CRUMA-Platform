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

cleanup_file="supabase/tests/database/location_release_concurrency_cleanup.sql"
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
run_sql < supabase/tests/database/location_release_concurrency_setup.sql
output_a="$(mktemp)"
output_b="$(mktemp)"

# Order one: reclassification gets the row lock first. The mass release must
# wait for it and reject using the committed classification, without records.
classify_first="BEGIN; UPDATE public.inventory_locations SET location_use='finished_product', storage_condition='frozen' WHERE id='ec200000-0000-4000-8000-000000000001'; SELECT pg_sleep(2); COMMIT;"
docker exec -e PGAPPNAME=location-policy-first-a "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$classify_first" > "$output_a" 2>&1 &
session_a=$!
if ! wait_for_sleep location-policy-first-a; then
  echo "La reclasificación inicial no retuvo su cambio durante la espera." >&2
  cat "$output_a" >&2
  wait "$session_a" || true
  exit 1
fi

release_mass="SET request.jwt.claim.sub='ec000000-0000-4000-8000-000000000001'; SELECT public.release_finished_product_quality_to_inventory('ec900000-0000-4000-8000-000000000001','LOC-RACE-MASS-LOT','2099-12-31','ec100000-0000-4000-8000-000000000001','ec200000-0000-4000-8000-000000000001','eca00000-0000-4000-8000-000000000001','Concurrency mass location validation');"
docker exec -e PGAPPNAME=location-policy-first-b "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$release_mass" > "$output_b" 2>&1 &
session_b=$!
if ! wait_for_lock location-policy-first-b; then
  echo "La liberación de masa no esperó a que terminara la reclasificación." >&2
  cat "$output_b" >&2
  wait "$session_a" || true
  wait "$session_b" || true
  exit 1
fi
wait "$session_a"
if wait "$session_b"; then
  echo "La liberación de masa aceptó la clasificación incompatible confirmada." >&2
  cat "$output_b" >&2
  exit 1
fi
if ! grep -Fq 'Intermediate mass requires an active refrigerated semielaborado location.' "$output_b"; then
  echo "La liberación de masa se rechazó por una causa distinta a la política actualizada:" >&2
  cat "$output_b" >&2
  exit 1
fi

# Order two: the finished-product release locks the location first. The
# reclassification must wait, observe the new lot, and reject the update.
release_finished_first="BEGIN; SET LOCAL request.jwt.claim.sub='ec000000-0000-4000-8000-000000000001'; SELECT public.release_finished_product_quality_to_inventory('ec900000-0000-4000-8000-000000000002','LOC-RACE-FG-LOT','2099-12-31','ec100000-0000-4000-8000-000000000001','ec200000-0000-4000-8000-000000000002','eca00000-0000-4000-8000-000000000002','Concurrency finished-product location validation'); SELECT pg_sleep(2); COMMIT;"
docker exec -e PGAPPNAME=location-release-first-a "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$release_finished_first" > "$output_a" 2>&1 &
session_a=$!
if ! wait_for_sleep location-release-first-a; then
  echo "La liberación inicial no conservó el bloqueo de la ubicación." >&2
  cat "$output_a" >&2
  wait "$session_a" || true
  exit 1
fi

reclassify_finished="UPDATE public.inventory_locations SET location_use='prepared_ingredient', storage_condition='refrigerated' WHERE id='ec200000-0000-4000-8000-000000000002';"
docker exec -e PGAPPNAME=location-release-first-b "$database_container" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -c "$reclassify_finished" > "$output_b" 2>&1 &
session_b=$!
if ! wait_for_lock location-release-first-b; then
  echo "La reclasificación no esperó a que terminara la liberación." >&2
  cat "$output_b" >&2
  wait "$session_a" || true
  wait "$session_b" || true
  exit 1
fi
wait "$session_a"
if wait "$session_b"; then
  echo "Se reclasificó una ubicación después de liberar producto terminado allí." >&2
  cat "$output_b" >&2
  exit 1
fi
if ! grep -Fq 'Resolve available, waiting, freezing, frozen, or quality-custody product quantities before changing this location.' "$output_b"; then
  echo "La reclasificación se rechazó por una causa distinta al lote liberado:" >&2
  cat "$output_b" >&2
  exit 1
fi

run_sql < supabase/tests/database/location_release_concurrency_assert.sql
echo "Concurrencia de liberación y reclasificación de ubicaciones: aprobada en ambos órdenes."
