#!/usr/bin/env bash

set -euo pipefail

test_directory="supabase/tests/database"

for sql_file in \
  "$test_directory/raw_material_legacy_unit_update.sql" \
  "$test_directory"/raw_material_unit_*.sql
do
  if [[ ! -f "$sql_file" ]]; then
    continue
  fi

  bash scripts/database/run-database-test.sh "$sql_file"
done
