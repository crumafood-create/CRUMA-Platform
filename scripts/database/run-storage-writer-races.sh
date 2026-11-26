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

output_a="$(mktemp)"
output_b="$(mktemp)"
cleanup() {
  run_sql < supabase/tests/database/storage_writer_races_cleanup.sql >/dev/null 2>&1 || true
  rm -f "$output_a" "$output_b"
}
trap cleanup EXIT

wait_for_lock() {
  local application_name="$1"
  local poll_sql
  poll_sql="DO \$wait\$
DECLARE
  attempt integer;
  lock_seen boolean := false;
BEGIN
  FOR attempt IN 1..100 LOOP
    PERFORM pg_stat_clear_snapshot();
    SELECT EXISTS (
      SELECT 1 FROM pg_stat_activity
      WHERE application_name = '$application_name'
        AND state = 'active' AND wait_event_type = 'Lock'
    ) INTO lock_seen;
    EXIT WHEN lock_seen;
    PERFORM pg_sleep(0.1);
  END LOOP;
  IF NOT lock_seen THEN
    RAISE EXCEPTION 'Timed out waiting for lock from %.', '$application_name';
  END IF;
END;
\$wait\$;"
  docker exec "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$poll_sql" >/dev/null 2>&1
}

wait_for_sleep() {
  local application_name="$1"
  for attempt in {1..100}; do
    if docker exec "$database_container" psql -U postgres -d postgres -Atc \
      "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name = '$application_name' AND state = 'active' AND query LIKE '%pg_sleep(8)%')" | grep -qx t; then
      return 0
    fi
    sleep 0.1
  done
  return 1
}

expect_wait_then_reject() {
  local label="$1" application_name="$2" blocker_pid="$3" contender_pid="$4" expected_error="$5"
  if ! wait_for_lock "$application_name"; then
    echo "$label no esperó el bloqueo de la clasificación de almacenamiento." >&2
    cat "$output_b" >&2
    wait "$blocker_pid" || true
    wait "$contender_pid" || true
    exit 1
  fi
  wait "$blocker_pid"
  if wait "$contender_pid"; then
    echo "$label aceptó una clasificación incompatible." >&2
    cat "$output_b" >&2
    exit 1
  fi
  if ! grep -Fq "$expected_error" "$output_b"; then
    echo "$label se rechazó por una causa distinta a la política confirmada:" >&2
    cat "$output_b" >&2
    exit 1
  fi
}

run_sql < supabase/tests/database/storage_writer_races_cleanup.sql
run_sql < supabase/tests/database/storage_writer_races_setup.sql

# Freezing start waits for a location-policy edit and rejects the newly
# incompatible freezer without creating an operation, movement, or balance.
block="BEGIN; UPDATE public.inventory_locations SET location_use='prepared_ingredient',storage_condition='refrigerated' WHERE id='fd200000-0000-4000-8000-000000000002'; SELECT pg_sleep(8); COMMIT;"
docker exec -e PGAPPNAME=storage-writer-freeze-policy-first-a "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$block" > "$output_a" 2>&1 &
pid_a=$!
if ! wait_for_sleep storage-writer-freeze-policy-first-a; then
  echo "No inició la actualización de política previa al inicio de congelación." >&2
  cat "$output_a" >&2
  wait "$pid_a" || true
  exit 1
fi
action="SET request.jwt.claim.sub='fd000000-0000-4000-8000-000000000001'; SELECT public.start_product_lot_freezing('fd800000-0000-4000-8000-000000000001',10,'Freeze policy race','fdc00000-0000-4000-8000-000000000001','fd200000-0000-4000-8000-000000000002');"
docker exec -e PGAPPNAME=storage-writer-freeze-policy-first-b "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$action" > "$output_b" 2>&1 &
pid_b=$!
expect_wait_then_reject 'Inicio de congelación con reclasificación previa' storage-writer-freeze-policy-first-b "$pid_a" "$pid_b" 'Configure an active finished-product freezer location.'
run_sql <<'SQL'
DO $assert_freeze_policy_first$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.inventory_locations WHERE id='fd200000-0000-4000-8000-000000000002' AND location_use='prepared_ingredient' AND storage_condition='refrigerated')
     OR NOT EXISTS (SELECT 1 FROM public.product_lot_storage_balances WHERE product_lot_id='fd800000-0000-4000-8000-000000000001' AND fresh_quantity=10 AND freezing_quantity=0 AND freezing_location_id IS NULL)
     OR (SELECT quantity FROM public.product_lots WHERE id='fd800000-0000-4000-8000-000000000001') <> 10
     OR EXISTS (SELECT 1 FROM public.product_lot_freezing_operations WHERE product_lot_id='fd800000-0000-4000-8000-000000000001')
     OR EXISTS (SELECT 1 FROM public.inventory_movements WHERE reference_type='product_lot_freezing_start' AND item_id='fd400000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Policy-first freezing rejection changed location, balance, operation or movements.';
  END IF;
END;
$assert_freeze_policy_first$;
SQL

# A successful freezing start holds a share lock. A concurrent location edit
# waits, sees the new freezing balance, and rejects without changing the policy.
action="BEGIN; SET LOCAL request.jwt.claim.sub='fd000000-0000-4000-8000-000000000001'; SELECT public.start_product_lot_freezing('fd800000-0000-4000-8000-000000000002',10,'Freeze operation first','fdc00000-0000-4000-8000-000000000002','fd200000-0000-4000-8000-000000000003'); SELECT pg_sleep(8); COMMIT;"
docker exec -e PGAPPNAME=storage-writer-freeze-operation-first-a "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$action" > "$output_a" 2>&1 &
pid_a=$!
if ! wait_for_sleep storage-writer-freeze-operation-first-a; then
  echo "El inicio de congelación no retuvo el bloqueo del congelador." >&2
  cat "$output_a" >&2
  wait "$pid_a" || true
  exit 1
fi
action="UPDATE public.inventory_locations SET location_use='prepared_ingredient',storage_condition='refrigerated' WHERE id='fd200000-0000-4000-8000-000000000003';"
docker exec -e PGAPPNAME=storage-writer-freeze-operation-first-b "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$action" > "$output_b" 2>&1 &
pid_b=$!
expect_wait_then_reject 'Reclasificación durante inicio de congelación' storage-writer-freeze-operation-first-b "$pid_a" "$pid_b" 'Resolve available, waiting, freezing, frozen, or quality-custody product quantities before changing this location.'
run_sql <<'SQL'
DO $assert_freeze_operation_first$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.inventory_locations WHERE id='fd200000-0000-4000-8000-000000000003' AND location_use='finished_product' AND storage_condition='frozen')
     OR NOT EXISTS (SELECT 1 FROM public.product_lot_storage_balances WHERE product_lot_id='fd800000-0000-4000-8000-000000000002' AND fresh_quantity=0 AND freezing_quantity=10 AND freezing_location_id='fd200000-0000-4000-8000-000000000003')
     OR (SELECT quantity FROM public.product_lots WHERE id='fd800000-0000-4000-8000-000000000002') <> 0
     OR (SELECT count(*) FROM public.product_lot_freezing_operations WHERE product_lot_id='fd800000-0000-4000-8000-000000000002') <> 1
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type='product_lot_freezing_start' AND item_id='fd400000-0000-4000-8000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'Operation-first freezing left an incompatible policy or inconsistent inventory.';
  END IF;
END;
$assert_freeze_operation_first$;
SQL

# Resolving refrigerated waiting stock observes a policy change committed
# first and leaves the waiting balance and history untouched.
block="BEGIN; UPDATE public.inventory_locations SET location_use='prepared_ingredient',storage_condition='refrigerated' WHERE id='fd200000-0000-4000-8000-000000000004'; SELECT pg_sleep(8); COMMIT;"
docker exec -e PGAPPNAME=storage-writer-wait-policy-first-a "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$block" > "$output_a" 2>&1 &
pid_a=$!
if ! wait_for_sleep storage-writer-wait-policy-first-a; then
  echo "No inició la reclasificación previa a la salida de espera refrigerada." >&2
  cat "$output_a" >&2
  wait "$pid_a" || true
  exit 1
fi
action="SET request.jwt.claim.sub='fd000000-0000-4000-8000-000000000001'; SELECT public.decide_product_lot_refrigerated_wait('fd800000-0000-4000-8000-000000000003',10,'freezing','fd200000-0000-4000-8000-000000000004','Wait policy race','fdc00000-0000-4000-8000-000000000003');"
docker exec -e PGAPPNAME=storage-writer-wait-policy-first-b "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$action" > "$output_b" 2>&1 &
pid_b=$!
expect_wait_then_reject 'Salida de espera con reclasificación previa' storage-writer-wait-policy-first-b "$pid_a" "$pid_b" 'Freezing destination is not a configured finished-product freezer.'
run_sql <<'SQL'
DO $assert_wait_policy_first$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.inventory_locations WHERE id='fd200000-0000-4000-8000-000000000004' AND location_use='prepared_ingredient' AND storage_condition='refrigerated')
     OR NOT EXISTS (SELECT 1 FROM public.product_lot_storage_balances WHERE product_lot_id='fd800000-0000-4000-8000-000000000003' AND refrigerated_wait_quantity=10 AND freezing_quantity=0 AND freezing_location_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.product_lot_refrigerated_wait_decisions WHERE product_lot_id='fd800000-0000-4000-8000-000000000003')
     OR EXISTS (SELECT 1 FROM public.product_lot_freezing_operations WHERE product_lot_id='fd800000-0000-4000-8000-000000000003')
     OR EXISTS (SELECT 1 FROM public.inventory_movements WHERE reference_type='product_lot_refrigerated_wait_decision' AND item_id='fd400000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Policy-first refrigerated-wait rejection changed location, balance, operation, decision or movement.';
  END IF;
END;
$assert_wait_policy_first$;
SQL

# A wait-to-freezing decision locks its freezer until balance and operation are
# recorded; the subsequent incompatible location edit must reject.
action="BEGIN; SET LOCAL request.jwt.claim.sub='fd000000-0000-4000-8000-000000000001'; SELECT public.decide_product_lot_refrigerated_wait('fd800000-0000-4000-8000-000000000004',10,'freezing','fd200000-0000-4000-8000-000000000005','Wait operation first','fdc00000-0000-4000-8000-000000000004'); SELECT pg_sleep(8); COMMIT;"
docker exec -e PGAPPNAME=storage-writer-wait-operation-first-a "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$action" > "$output_a" 2>&1 &
pid_a=$!
if ! wait_for_sleep storage-writer-wait-operation-first-a; then
  echo "La salida de espera no retuvo el bloqueo del congelador." >&2
  cat "$output_a" >&2
  wait "$pid_a" || true
  exit 1
fi
action="UPDATE public.inventory_locations SET location_use='prepared_ingredient',storage_condition='refrigerated' WHERE id='fd200000-0000-4000-8000-000000000005';"
docker exec -e PGAPPNAME=storage-writer-wait-operation-first-b "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$action" > "$output_b" 2>&1 &
pid_b=$!
expect_wait_then_reject 'Reclasificación durante salida de espera refrigerada' storage-writer-wait-operation-first-b "$pid_a" "$pid_b" 'Resolve available, waiting, freezing, frozen, or quality-custody product quantities before changing this location.'
run_sql <<'SQL'
DO $assert_wait_operation_first$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.inventory_locations WHERE id='fd200000-0000-4000-8000-000000000005' AND location_use='finished_product' AND storage_condition='frozen')
     OR NOT EXISTS (SELECT 1 FROM public.product_lot_storage_balances WHERE product_lot_id='fd800000-0000-4000-8000-000000000004' AND refrigerated_wait_quantity=0 AND freezing_quantity=10 AND freezing_location_id='fd200000-0000-4000-8000-000000000005')
     OR (SELECT count(*) FROM public.product_lot_refrigerated_wait_decisions WHERE product_lot_id='fd800000-0000-4000-8000-000000000004') <> 1
     OR (SELECT count(*) FROM public.product_lot_freezing_operations WHERE product_lot_id='fd800000-0000-4000-8000-000000000004') <> 1
     OR (SELECT count(*) FROM public.inventory_movements WHERE reference_type='product_lot_refrigerated_wait_decision' AND item_id='fd400000-0000-4000-8000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'Operation-first wait decision left incompatible location policy or inconsistent balances.';
  END IF;
END;
$assert_wait_operation_first$;
SQL

# Configuring the habitual material destination holds the location policy row;
# a later incompatible reclassification waits and rejects.
block="BEGIN; UPDATE public.raw_materials SET required_storage_condition='refrigerated',default_storage_use='raw_material',default_inventory_location_id='fd200000-0000-4000-8000-000000000006' WHERE id='fda00000-0000-4000-8000-000000000001'; SELECT pg_sleep(8); COMMIT;"
docker exec -e PGAPPNAME=storage-writer-default-policy-first-a "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$block" > "$output_a" 2>&1 &
pid_a=$!
if ! wait_for_sleep storage-writer-default-policy-first-a; then
  echo "No inició la asignación de destino habitual para la prueba concurrente." >&2
  cat "$output_a" >&2
  wait "$pid_a" || true
  exit 1
fi
action="UPDATE public.inventory_locations SET location_use='prepared_ingredient' WHERE id='fd200000-0000-4000-8000-000000000006';"
docker exec -e PGAPPNAME=storage-writer-default-policy-first-b "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$action" > "$output_b" 2>&1 &
pid_b=$!
expect_wait_then_reject 'Reclasificación concurrente con destino habitual asignado' storage-writer-default-policy-first-b "$pid_a" "$pid_b" 'Location classification conflicts with an assigned material destination.'
run_sql <<'SQL'
DO $assert_default_policy_first$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id='fda00000-0000-4000-8000-000000000001' AND required_storage_condition='refrigerated' AND default_storage_use='raw_material' AND default_inventory_location_id='fd200000-0000-4000-8000-000000000006')
     OR NOT EXISTS (SELECT 1 FROM public.inventory_locations WHERE id='fd200000-0000-4000-8000-000000000006' AND location_use='raw_material' AND storage_condition='refrigerated' AND is_active) THEN
    RAISE EXCEPTION 'Policy-first destination assignment left an incompatible material configuration or location.';
  END IF;
END;
$assert_default_policy_first$;
SQL

# A location edit committed first makes the destination assignment wait and
# reject; the material must remain unconfigured rather than point incompatibly.
block="BEGIN; UPDATE public.inventory_locations SET location_use='prepared_ingredient' WHERE id='fd200000-0000-4000-8000-000000000007'; SELECT pg_sleep(8); COMMIT;"
docker exec -e PGAPPNAME=storage-writer-default-location-first-a "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$block" > "$output_a" 2>&1 &
pid_a=$!
if ! wait_for_sleep storage-writer-default-location-first-a; then
  echo "No inició la reclasificación previa a configurar el destino habitual." >&2
  cat "$output_a" >&2
  wait "$pid_a" || true
  exit 1
fi
action="UPDATE public.raw_materials SET required_storage_condition='refrigerated',default_storage_use='raw_material',default_inventory_location_id='fd200000-0000-4000-8000-000000000007' WHERE id='fda00000-0000-4000-8000-000000000002';"
docker exec -e PGAPPNAME=storage-writer-default-location-first-b "$database_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$action" > "$output_b" 2>&1 &
pid_b=$!
expect_wait_then_reject 'Asignación de destino concurrente con reclasificación previa' storage-writer-default-location-first-b "$pid_a" "$pid_b" 'The default destination is missing, inactive, or incompatible with the material.'
run_sql <<'SQL'
DO $assert_default_location_first$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.inventory_locations WHERE id='fd200000-0000-4000-8000-000000000007' AND location_use='prepared_ingredient' AND storage_condition='refrigerated' AND is_active)
     OR NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE id='fda00000-0000-4000-8000-000000000002' AND required_storage_condition IS NULL AND default_storage_use IS NULL AND default_inventory_location_id IS NULL) THEN
    RAISE EXCEPTION 'Location-first destination assignment changed the material or left incompatible configuration.';
  END IF;
END;
$assert_default_location_first$;
SQL

run_sql < supabase/tests/database/storage_writer_races_cleanup.sql
trap - EXIT
rm -f "$output_a" "$output_b"
echo "Concurrencia de inicio de congelación, salida de espera y asignación de destino: aprobada en ambos órdenes."
