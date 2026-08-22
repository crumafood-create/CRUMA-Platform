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
- Suite de seguridad para funciones, privilegios de tablas y comportamiento RLS.
- Job `database` de CI para reconstrucción, lint y pruebas de base de datos desde cero.
- Estrategia de seeds sintéticos, deterministas e idempotentes separada por propósito.
- Contrato automatizado de esquema y estrategia de seeds integrado en `db:verify`.
- Tipos TypeScript generados desde Supabase local y verificados contra Git en CI.
- Inventario reproducible de referencias Supabase usadas por la aplicación.

Migraciones actuales:

- `20260801000000_required_extensions.sql`
- `20260802000000_schema_baseline.sql`
- `20260804000000_harden_function_execution.sql`
- `20260806000000_harden_table_privileges.sql`
- `20260807000000_scope_admin_rls_policies.sql`
- `20260809000000_reconcile_catalog_schema_contract.sql`
- `20260809010000_enforce_product_family_category_consistency.sql`

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

Ejecutar las pruebas conductuales de RLS:

```bash
pnpm db:test:rls-behavior
```

Ejecutar todas las pruebas de seguridad de base de datos:

```bash
pnpm db:test:security
```

Generar los tipos canónicos únicamente desde el esquema local `public`:

```bash
pnpm db:types:generate
```

El resultado versionado se conserva en
`src/types/database/database.generated.ts`. El generador usa exclusivamente
`supabase gen types typescript --local --schema public --network-id cruma-supabase-local`
y elimina credenciales remotas del proceso hijo; no requiere acceso ni conexión
a Production. La red explícita permite al generador resolver la base local en
Codespaces y CI.

Verificar que los tipos comprometidos coinciden con la base local:

```bash
pnpm db:types:check
```

La verificación falla si el contrato versionado no coincide con el generado.
Después de crear o modificar una migración, reconstruir Supabase local,
regenerar los tipos y revisar ambos cambios en el mismo Pull Request.

Los clientes browser y middleware utilizan directamente el contrato generado.
En servidor, `createTypedClient()` expone consultas estrictamente tipadas y
`createClient()` conserva temporalmente la interfaz heredada mientras se migran
los consumidores existentes. Los contratos `TypedSupabaseClient`,
`PublicTableRow`, `PublicTableInsert` y `PublicTableUpdate` pertenecen
exclusivamente a infraestructura; no sustituyen modelos de dominio.

Validar la configuración pública y el aislamiento de credenciales:

```bash
pnpm db:test:client-contract
```

Ejecutar la validación completa:

```bash
pnpm db:verify
```

`db:verify` ejecuta en orden:

1. reconstrucción limpia de la base con `--no-seed`;
2. carga explícita de `base.sql` + `test.sql`;
3. lint del esquema;
4. pruebas de seguridad de funciones, privilegios de tablas y comportamiento RLS;
5. prueba del contrato de esquema;
6. reaplicación idempotente de `base.sql` + `test.sql`;
7. prueba automatizada de la estrategia de seeds;
8. contratos de generación segura de tipos;
9. contratos de configuración pública para clientes Supabase;
10. y comparación reproducible de tipos versionados contra el esquema local.

## Seeds por entorno

Los datos sintéticos se mantienen separados de las migraciones y se organizan por propósito:

```text
supabase/seeds/
├── base.sql
├── local.sql
├── test.sql
├── preview.sql
└── staging.sql
```

- `base.sql`: catálogo mínimo compartido por los perfiles no productivos.
- `local.sql`: datos adicionales para desarrollo local.
- `test.sql`: datos controlados para pruebas automatizadas.
- `preview.sql` y `staging.sql`: perfiles explícitos para esos entornos.
- Production no recibe seeds automáticos ni datos demo.

Los seeds usan identificadores deterministas y operaciones idempotentes. Pueden reaplicarse sin duplicar registros ni alterar claves estables.

`supabase/config.toml` configura el reset local para cargar, en orden, `base.sql` y `local.sql`. El perfil de pruebas evita el seed automático y carga explícitamente `base.sql` + `test.sql`:

```bash
pnpm db:reset
pnpm db:reset:test
```

También pueden cargarse los perfiles de forma explícita:

```bash
pnpm db:seed:base
pnpm db:seed:local
pnpm db:seed:test
```

La prueba automatizada valida el aislamiento entre perfiles, los identificadores esperados y la reaplicación idempotente:

```bash
pnpm db:test:seed-strategy
```

## Pruebas de seguridad de base de datos

Las pruebas se encuentran en:

```text
supabase/tests/database/function_security.sql
supabase/tests/database/table_privileges.sql
supabase/tests/database/rls_behavior.sql
supabase/tests/database/schema_contract.sql
supabase/tests/database/seed_strategy.sql
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

La prueba de comportamiento RLS valida de forma transaccional:

- visibilidad pública de productos activos y ocultamiento de productos inactivos o eliminados;
- bloqueo de escritura de productos para usuarios normales y acceso para administradores;
- acceso de cada usuario a su propio perfil y aislamiento de perfiles ajenos;
- lectura de roles propios y administración de roles por usuarios autorizados;
- lectura de tenants por miembros y aislamiento frente a usuarios externos;
- operaciones de creación, actualización y eliminación reservadas al propietario;
- y visibilidad exclusiva de la membresía propia.

La migración `20260807000000_scope_admin_rls_policies.sql` limita las políticas administrativas de productos y roles al rol `authenticated`, evitando que las lecturas anónimas evalúen funciones administrativas.

## Verificación en CI

El workflow `.github/workflows/ci.yml` contiene un job `database` que:

1. instala la versión fijada de Supabase CLI;
2. crea la red Docker local aislada;
3. inicia Supabase excluyendo `vector` y `logflare`;
4. ejecuta `pnpm db:verify`;
5. y detiene el entorno local incluso si una verificación falla.

El job no utiliza credenciales ni datos de Production.

## Guardas

- No añadir contraseñas, tokens, connection strings ni datos productivos.
- No vincular ni modificar Production durante validaciones locales.
- No ejecutar el baseline sobre una base existente.
- No modificar migraciones ya compartidas.
- No introducir datos demo en Production.
- Validar cada migración mediante reconstrucción local antes del merge.
- Mantener RLS, grants, funciones y triggers dentro del historial versionado.

## Trabajo pendiente para ADR-0002

- ampliar las pruebas RLS a tablas operativas y contratos multi-tenant adicionales;
- y aprobaciones formales del ADR.

La reconciliación remota y la comparación gobernada de drift quedaron
verificadas con siete migraciones compartidas y cero diferencias de esquema.
La auditoría posterior aprobó nueve controles de RLS, privilegios y funciones;
el detalle consta en el [cierre productivo](../docs/engineering/security-audits/2026-08-21-production-migration-reconciliation-closeout.md).
