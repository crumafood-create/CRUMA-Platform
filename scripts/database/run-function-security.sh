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
  echo "Inicia Supabase local antes de ejecutar esta prueba." >&2
  exit 1
fi

echo "Ejecutando pruebas en: $database_container"

docker exec -i "$database_container" \
  psql \
  -U postgres \
  -d postgres \
  -v ON_ERROR_STOP=1 \
  < supabase/tests/database/function_security.sql
