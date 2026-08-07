#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: $0 <archivo-sql>" >&2
  exit 2
fi

sql_file="$1"

if [[ ! -f "$sql_file" ]]; then
  echo "No existe el archivo SQL: $sql_file" >&2
  exit 2
fi

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

echo "Ejecutando $(basename "$sql_file") en: $database_container"

docker exec -i "$database_container" \
  psql \
  -U postgres \
  -d postgres \
  -v ON_ERROR_STOP=1 \
  < "$sql_file"
