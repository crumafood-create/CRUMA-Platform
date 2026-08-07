# Supabase: baseline, migraciones y validación local

Esta carpeta contiene la configuración, las migraciones y las pruebas locales de PostgreSQL/Supabase para CRUMAFOOD Platform.

Su propósito es avanzar la validación de [ADR-0002](../docs/architecture/adr/0002-schema-baseline-and-migrations.md).

## Estado actual

- Supabase CLI fijado en `2.109.1`.
- Configuración local en `supabase/config.toml`.
- Migraciones canónicas en `supabase/migrations/`.
- Baseline del esquema versionado.
- Reconstrucción local desde cero validada.
- Lint del esquema validado con nivel `error`.
- Suite de seguridad para funciones y privilegios de tablas.
- Inventario reproducible de referencias Supabase usadas por la aplicación.

Migraciones actuales:

- `20260801000000_required_extensions.sql`
- `20260802000000_schema_baseline.sql`
- `20260804000000_harden_function_execution.sql`
- `20260806000000_harden_table_privileges.sql`

La reconstrucción local validada contiene:

- 124 tablas en `public`;
- 12 vistas;
- 188 policies;
- RLS habilitado en las 124 tablas de aplicación;
- y los demás objetos incluidos en las migraciones versionadas.

## Requisitos locales

- Docker.
- Node y pnpm según ADR-0013.
- Supabase CLI instalado mediante las dependencias del proyecto.
- Red Docker `cruma-supabase-local`.

La red se crea una sola vez:

```bash
docker network create \
  -o 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' \
  cruma-supabase-local
```

## Iniciar Supabase local

En Codespaces se excluyen `vector` y `logflare` por incompatibilidades observadas en sus health checks:

```bash
pnpm exec supabase start \
  --network-id cruma-supabase-local \
  -x vector,logflare
```

No utilizar `--ignore-health-check`.

Estas acciones operan únicamente sobre el entorno local y no enlazan el CLI con proyectos alojados.

## Comandos canónicos

Verificar la versión de Supabase CLI:

```bash
pnpm db:toolchain
```

Inventariar las referencias Supabase literales usadas en `src`:

```bash
pnpm db:inventory
```

Reconstruir la base local desde cero:

```bash
pnpm db:reset
```

Ejecutar el lint del esquema:

```bash
pnpm db:lint
```

Ejecutar la prueba de seguridad de funciones:

```bash
pnpm db:test:function-security
```

Ejecutar la prueba de privilegios de tablas:

```bash
pnpm db:test:table-privileges
```

Ejecutar todas las pruebas de seguridad de base de datos:

```bash
pnpm db:test:security
```

Ejecutar la validación completa:

```bash
pnpm db:verify
```

`db:verify` ejecuta en orden:

1. reconstrucción de la base local;
2. lint del esquema;
3. pruebas de seguridad de funciones y privilegios de tablas.

## Pruebas de seguridad de base de datos

Las pruebas se encuentran en:

```text
supabase/tests/database/function_security.sql
supabase/tests/database/table_privileges.sql
```

La prueba de funciones valida que:

- las funciones endurecidas tengan un `search_path` vacío;
- `PUBLIC`, `anon` y `service_role` no tengan permisos de ejecución;
- `authenticated` solo pueda ejecutar las RPC autorizadas;
- las funciones de aplicación previstas conserven `SECURITY INVOKER`;
- y las funciones privilegiadas previstas conserven `SECURITY DEFINER`.

Las pruebas se ejecutan dentro de transacciones y finalizan con `ROLLBACK`.

La prueba de privilegios de tablas valida que:

- `anon` y `authenticated` no tengan `TRUNCATE`;
- `anon` y `authenticated` no tengan `REFERENCES`;
- `anon` y `authenticated` no tengan `TRIGGER`;
- esos privilegios tampoco sean concedidos por defecto a tablas futuras;
- y `service_role` conserve el acceso privilegiado previsto.

Esta suite todavía no sustituye las pruebas conductuales positivas y negativas de RLS por usuario y tenant.

## Guardas

- No añadir contraseñas, tokens, connection strings ni datos productivos.
- No vincular ni modificar Production durante validaciones locales.
- No ejecutar el baseline sobre una base existente.
- No modificar migraciones ya compartidas.
- No introducir datos demo en Production.
- Validar cada migración mediante reconstrucción local antes del merge.
- Mantener RLS, grants, funciones y triggers dentro del historial versionado.

## Trabajo pendiente para ADR-0002

- pruebas positivas y negativas representativas de RLS;
- estrategia de seeds;
- integración de la verificación de base de datos en CI;
- reconciliación segura del historial remoto;
- comparación gobernada de drift;
- y aprobaciones formales del ADR.
