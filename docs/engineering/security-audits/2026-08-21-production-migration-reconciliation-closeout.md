# Cierre de reconciliación y verificación de Production

## Metadata

| Campo | Valor |
|---|---|
| Estado | Verificado |
| Fecha | 2026-08-21 |
| Proyecto | `poglpqvmbrfcvtuspvtx` |
| Referencia arquitectónica | ADR-0002 |
| Commit verificado | `29b5603c` |
| Pull requests operativos | #53 y #54 |
| Datos productivos inspeccionados | Ninguno |
| Credenciales persistidas | Ninguna |

## 1. Resultado de la reconciliación

El inventario posterior confirmó siete versiones idénticas en Git y Production:

| Versión | Estrategia aplicada | Estado |
|---|---|---|
| `20260801000000` | Reparación individual de historial | Compartida |
| `20260802000000` | Reparación individual de historial | Compartida |
| `20260804000000` | Aplicación de migración pendiente | Compartida |
| `20260806000000` | Aplicación de migración pendiente | Compartida |
| `20260807000000` | Aplicación de migración pendiente | Compartida |
| `20260809000000` | Aplicación de migración pendiente | Compartida |
| `20260809010000` | Aplicación de migración pendiente | Compartida |

La comparación posterior registró `Compartidas: 7`, `Solo locales: 0` y
`Solo remotas: 0`. La ejecución protegida finalizó con
`PRODUCTION_EXECUTION_STATUS=0`.

## 2. Incidencia controlada y reanudación

La primera reparación fue aplicada, pero el checkpoint inicialmente rechazó la
salida real de Supabase CLI porque las versiones estaban delimitadas por
acentos graves. La ejecución se detuvo antes de la segunda reparación.

El PR #54 corrigió el parser y añadió una reanudación explícita y limitada a
`CRUMA_PRODUCTION_RESUME_FROM=after-first-repair`. El dry-run posterior
finalizó con `RESUME_DRY_RUN_STATUS=0` y `REMOTE_WRITES_AUTHORIZED=false`.

Tras una autorización humana independiente, la reanudación omitió la primera
reparación ya aplicada, registró exclusivamente la segunda versión, aplicó las
cinco migraciones pendientes y verificó el inventario final.

## 3. Verificación posterior del esquema

La auditoría de solo lectura ejecutó:

```text
supabase migration list --linked
pnpm db:history:compare <inventario-temporal>
supabase db diff --linked --schema public
```

Resultados verificados:

- `POSTDEPLOY_AUDIT_STATUS=0`;
- siete migraciones compartidas;
- ninguna versión exclusivamente local o remota;
- `No schema changes found`;
- y archivo de drift de cero líneas y cero bytes.

El fingerprint histórico
`112eaa0b8899c0f3f489f9d3d7c950688171a8b40085085fc76c3d5b52a7b524`
corresponde exclusivamente al drift previo aprobado; no representa el estado
posterior, cuya comparación no produjo diferencias.

## 4. Controles de seguridad verificados

La consulta productiva utilizó `BEGIN TRANSACTION READ ONLY` y `ROLLBACK`,
sin leer registros de negocio ni ejecutar mutaciones.

| Control | Resultado |
|---|---|
| `RLS_PRODUCTS` | `OK` |
| `RLS_USER_ROLES` | `OK` |
| `ADMIN_POLICIES_AUTHENTICATED` | `OK` |
| `UNSAFE_TABLE_PRIVILEGES` | `OK` |
| `PROTECTED_FUNCTIONS_PRESENT` | `OK` |
| `FUNCTION_SEARCH_PATH` | `OK` |
| `FUNCTION_ANON_BLOCKED` | `OK` |
| `FUNCTION_SERVICE_ROLE_BLOCKED` | `OK` |
| `FUNCTION_EXECUTION_MODEL` | `OK` |

La revisión funcional abarcó `create_production_order_items`,
`decrease_product_lot_quantity`, `handle_new_user` e `is_admin`. Las políticas
administrativas verificadas corresponden exclusivamente a `products` y
`user_roles`; este resultado no acredita cobertura RLS universal.

## 5. Validaciones locales

| Verificación | Resultado |
|---|---|
| `pnpm typecheck` | Aprobada |
| `pnpm db:test:migration-history` | 23 pruebas aprobadas |
| `pnpm db:test:reconciliation` | 33 pruebas aprobadas |
| Total | 56 pruebas aprobadas |
| Estado del repositorio validado | `main` limpio y sincronizado |

Los tokens temporales utilizados durante las ventanas autorizadas fueron
retirados al concluir. No se incorporaron secretos, cadenas de conexión,
registros productivos ni artefactos temporales al repositorio.

## 6. Alcance y pendientes

El baseline, el historial remoto, el drift posterior y los nueve controles
enumerados cuentan con evidencia operativa satisfactoria. ADR-0002 permanece
en estado **Propuesto**: esta evidencia no sustituye la aprobación formal de
Product Owner, arquitectura, datos y operación.

Permanece pendiente ampliar las pruebas RLS a otras tablas operativas y a los
contratos multi-tenant definidos por la arquitectura.

## Referencias

- [ADR-0002](../../architecture/adr/0002-schema-baseline-and-migrations.md)
- [Runbook de historial remoto](../supabase-remote-migration-history.md)
- [Autorización y reanudación protegidas](../production-migration-reconciliation-authorization.md)
- [Auditoría original de autorización](./2026-08-03-database-function-authorization.md)
