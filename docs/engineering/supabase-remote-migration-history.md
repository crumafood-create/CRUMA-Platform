# Reconciliación del historial remoto de migraciones Supabase

## Objetivo

Inventariar y comparar de forma segura el historial de migraciones local con el remoto antes de aprobar cualquier reparación. Este procedimiento no autoriza cambios en Production.

## Evidencia disponible al 2026-08-18

- Git contiene siete migraciones locales:
  - 20260801000000_required_extensions.sql
  - 20260802000000_schema_baseline.sql
  - 20260804000000_harden_function_execution.sql
  - 20260806000000_harden_table_privileges.sql
  - 20260807000000_scope_admin_rls_policies.sql
  - 20260809000000_reconcile_catalog_schema_contract.sql
  - 20260809010000_enforce_product_family_category_consistency.sql
- Una ventana autorizada de solo lectura permitió ejecutar `supabase migration list --linked` con código de salida 0.
- El inventario mostró las siete versiones en Local y ninguna versión en Remote.
- Una consulta de solo lectura confirmó que `supabase_migrations.schema_migrations` no existe en Production.
- `supabase db diff --linked --schema public` terminó con código 0 y produjo evidencia sanitizada de drift: 1,600 líneas, 56,630 bytes y SHA-256 `112eaa0b8899c0f3f489f9d3d7c950688171a8b40085085fc76c3d5b52a7b524`.
- El diff contiene 4 sentencias `CREATE`, 11 `ALTER`, 3 `DROP`, 744 `GRANT` y 0 `REVOKE`; se conserva únicamente como evidencia y no debe ejecutarse.
- Los controles de secretos sobre ambos inventarios terminaron sin hallazgos.
- El token temporal fue revocado después de capturar la evidencia y no se persistieron credenciales en el repositorio.
- No se ejecutaron escrituras en Production.

La columna Remote vacía, combinada con la ausencia de la tabla de historial, demuestra que el ledger remoto no está inicializado. No autoriza a considerar las siete migraciones aplicadas ni a reparar el historial automáticamente.

## Guardrails obligatorios

- No guardar tokens, contraseñas, JWT ni URLs con credenciales en Git o en los artefactos de evidencia.
- No ejecutar db push, db reset, db pull, migration up ni baseline sobre Production durante el inventario.
- No ejecutar migration repair durante la fase de lectura y clasificación.
- No modificar, renombrar ni reescribir migraciones compartidas.
- Mantener ADR-0002 en Propuesto hasta completar inventario, revisión y aprobaciones.
- Interrumpir el procedimiento ante cualquier duda sobre proyecto, entorno o identidad autorizada.

## Requisitos de acceso

La persona operadora debe contar con acceso temporal y autorizado de solo lectura al proyecto correcto. Las credenciales se suministran mediante el gestor aprobado de secretos y nunca por chat, commits o archivos del repositorio.

Antes de continuar, confirmar:

1. referencia exacta del proyecto de Production;
2. identidad de la persona operadora;
3. ventana de trabajo autorizada;
4. carpeta temporal de evidencia fuera del repositorio;
5. ausencia de comandos de escritura en la sesión.

## 1. Capturar inventario remoto de solo lectura

Con el flujo linked autorizado, autenticar la CLI fuera del repositorio y ejecutar:

    evidence_dir=$(mktemp -d)
    chmod 700 "$evidence_dir"
    pnpm exec supabase migration list --linked > "$evidence_dir/migration-list.txt"

Alternativamente, usar una URL autorizada de solo lectura disponible únicamente en la sesión:

    pnpm exec supabase migration list --db-url "$PRODUCTION_DATABASE_URL" > "$evidence_dir/migration-list.txt"

Verificar el código de salida antes de interpretar el archivo. Si la columna Remote está vacía, comprobar mediante una consulta de solo lectura si existe `supabase_migrations.schema_migrations`. Una tabla ausente se clasifica como ledger remoto no inicializado, no como historial alineado.

## 2. Comparar contra Git

    pnpm db:history:compare "$evidence_dir/migration-list.txt"

Códigos de salida:

- 0: historial alineado;
- 2: divergencia detectada;
- 1: entrada inválida, archivo ausente o ninguna versión remota parseable.

El comparador clasifica las versiones como compartidas, solo locales y solo remotas.

## 3. Clasificar el resultado

| Resultado | Interpretación | Acción permitida en esta fase |
|---|---|---|
| Solo compartidas | Git y remoto coinciden | Documentar evidencia y solicitar revisión |
| Solo locales | Git contiene versiones no registradas remotamente | Investigar despliegue y procedencia; no aplicar automáticamente |
| Solo remotas | Production registra versiones ausentes en Git | Bloquear despliegues y recuperar evidencia de origen |
| Ambas divergencias | Historial bifurcado o incompleto | Escalar a datos y arquitectura |
| Ninguna versión parseable | Inventario inválido, ledger ausente o acceso insuficiente | Comprobar el código de salida y la existencia de la tabla de historial; detenerse |

## 4. Capturar drift de esquema

Después del inventario y todavía dentro de una ventana autorizada de solo lectura:

    pnpm exec supabase db diff --linked --schema public > "$evidence_dir/schema-drift.sql"

El SQL generado es evidencia diagnóstica: no se ejecuta. Registrar código de salida, tamaño, SHA-256, conteos por tipo de sentencia y revisión por objeto. Ejecutar secret scanning antes de adjuntarlo a cualquier ticket o PR. La dirección e interpretación de cada cambio debe verificarse contra las migraciones canónicas; no se infiere únicamente por la presencia de `CREATE`, `ALTER` o `DROP`.

## 5. Preparar una reparación gobernada

Una propuesta de reparación debe incluir:

- inventario remoto sin secretos;
- salida del comparador;
- explicación de cada versión divergente;
- impacto esperado;
- respaldo o evidencia recuperable;
- plan de verificación;
- plan de reversión;
- aprobaciones de datos y arquitectura.

Cuando el ledger remoto no exista, la propuesta debe distinguir:

- migraciones representadas estructuralmente en Production y candidatas a reconciliación;
- migraciones no representadas, que deberán aplicarse mediante el flujo normal;
- y cualquier objeto remoto sin procedencia verificable en Git.

Nunca se marcarán todas las versiones como aplicadas por conveniencia. Cada candidata a `migration repair --status applied` requiere evidencia estructural independiente, aprobación explícita en el momento de ejecución y enumeración individual. Este runbook y esta rama no autorizan la reparación.

## 6. Verificación posterior

Después de una reparación aprobada:

1. repetir migration list con acceso de solo lectura;
2. ejecutar nuevamente el comparador;
3. exigir código de salida 0;
4. ejecutar CI y db:verify sobre una base local limpia;
5. adjuntar la evidencia revisada al PR o ticket de cambio;
6. actualizar el estado del ADR únicamente tras las aprobaciones requeridas.

## Reversión

Si una reparación aprobada produce un estado inesperado, detener despliegues, conservar la evidencia, notificar a datos y arquitectura y aplicar exclusivamente el plan de reversión aprobado. Nunca improvisar cambios sobre Production.
