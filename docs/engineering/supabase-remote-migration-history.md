# Reconciliación del historial remoto de migraciones Supabase

## Objetivo

Inventariar y comparar de forma segura el historial de migraciones local con el remoto antes de aprobar cualquier reparación. Este procedimiento no autoriza cambios en Production.

## Evidencia disponible al 2026-08-10

- Git contiene siete migraciones locales:
  - 20260801000000_required_extensions.sql
  - 20260802000000_schema_baseline.sql
  - 20260804000000_harden_function_execution.sql
  - 20260806000000_harden_table_privileges.sql
  - 20260807000000_scope_admin_rls_policies.sql
  - 20260809000000_reconcile_catalog_schema_contract.sql
  - 20260809010000_enforce_product_family_category_consistency.sql
- El entorno local conserva la referencia del proyecto y la URL del pooler, pero no contiene una contraseña de base de datos.
- pnpm exec supabase migration list --linked quedó bloqueado porque la sesión no dispone de SUPABASE_ACCESS_TOKEN.
- No se leyó el historial remoto y no se ejecutaron escrituras en Production.

La ausencia de versiones remotas observables no se interpreta como historial vacío.

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

Con una URL autorizada de solo lectura disponible únicamente en la sesión:

    evidence_dir=$(mktemp -d)
    pnpm exec supabase migration list --db-url "$PRODUCTION_DATABASE_URL" > "$evidence_dir/migration-list.txt"

Alternativamente, si la organización autoriza el flujo linked, autenticar la CLI fuera del repositorio y ejecutar migration list --linked. No conservar la salida si revela datos sensibles.

Verificar que el comando terminó correctamente y que el archivo contiene filas de versiones. Si no se puede parsear ninguna versión, detenerse: no asumir historial vacío.

## 2. Comparar contra Git

    pnpm db:history:compare -- "$evidence_dir/migration-list.txt"

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
| Ninguna versión parseable | Inventario inválido o acceso insuficiente | Detenerse y corregir el acceso o formato |

## 4. Preparar una reparación gobernada

Una propuesta de reparación debe incluir:

- inventario remoto sin secretos;
- salida del comparador;
- explicación de cada versión divergente;
- impacto esperado;
- respaldo o evidencia recuperable;
- plan de verificación;
- plan de reversión;
- aprobaciones de datos y arquitectura.

El comando migration repair --status applied solo puede evaluarse en una acción posterior, con aprobación explícita en el momento de ejecución y versiones enumeradas una por una. Este runbook y esta rama no lo autorizan.

## 5. Verificación posterior

Después de una reparación aprobada:

1. repetir migration list con acceso de solo lectura;
2. ejecutar nuevamente el comparador;
3. exigir código de salida 0;
4. ejecutar CI y db:verify sobre una base local limpia;
5. adjuntar la evidencia revisada al PR o ticket de cambio;
6. actualizar el estado del ADR únicamente tras las aprobaciones requeridas.

## Reversión

Si una reparación aprobada produce un estado inesperado, detener despliegues, conservar la evidencia, notificar a datos y arquitectura y aplicar exclusivamente el plan de reversión aprobado. Nunca improvisar cambios sobre Production.
