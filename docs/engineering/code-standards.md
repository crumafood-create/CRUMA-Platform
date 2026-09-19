# Estándares de ingeniería

Estas reglas mantienen la plataforma coherente mientras los módulos existentes se migran de forma incremental.

## Nomenclatura

- Componentes, tipos y clases usan `PascalCase`; funciones, variables y hooks usan `camelCase`.
- Archivos de código usan `kebab-case`; las pruebas terminan en `.test.ts` o `.test.tsx`.
- Los nombres describen intención de negocio: `loadDashboardSummary` en lugar de `getData`.

## Archivos y carpetas

- `src/app` compone rutas y vistas; no contiene reglas de negocio en los cortes ya migrados.
- `src/modules/<dominio>/application` contiene casos de uso, contratos y puertos de repositorio.
- `src/lib/database` normaliza respuestas y errores del proveedor de datos.
- `src/infrastructure` implementa integraciones externas, incluida Supabase.
- `src/shared/ui` es la fuente canónica para primitivas, formularios y overlays. `src/components` solo conserva reexportaciones temporales de compatibilidad.
- Una migración cambia un flujo vertical completo y evita reorganizaciones masivas sin cobertura.

## Errores

- Las respuestas Supabase pasan por `requireRows`, `requireOptional` o `requireSingle`.
- Los detalles internos del proveedor quedan en `cause`; la interfaz recibe mensajes estables y seguros.
- No se silencian errores de lectura crítica ni se sustituyen por datos vacíos.

## Logging

- No se registran tokens, cookies, datos personales ni payloads completos.
- Los eventos incluyen nombre de operación y un identificador técnico no sensible.
- Los errores esperados se modelan; los inesperados se propagan al límite que los reporta.

## Pruebas por módulo

- Cada regla de dominio tiene una prueba unitaria independiente de React y Supabase.
- Cada repositorio prueba el contrato de entrada y la normalización de errores.
- Los componentes compartidos prueban accesibilidad, variantes y composición.
- Todo cambio sigue RED → GREEN → REFACTOR y debe superar tipos, lint, unitarias, build, Storybook y base de datos antes de publicarse.
