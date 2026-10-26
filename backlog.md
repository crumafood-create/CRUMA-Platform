# Backlog

## Contexto

CRUMAFOOD necesita completar el recorrido de registrar productos y materias primas, definir una receta con sus ingredientes y crear una orden de producción, con datos y reglas coherentes entre pantalla, servidor y base de datos.

Stack: el existente en CRUMA, sin cambios propuestos.

Decisiones acordadas: solo CRUMAFOOD y una planta, sin sucursales ni franquicias; administrador mediante la autorización global vigente; primera versión con conexión, en español y MXN. No se crean tenant, organización, planta, campos ni columnas sin un consumidor real identificado. No se activa la autorización por organización pendiente del ADR-0017.

Arquitectura revisada: [ARCHITECTURE.md](ARCHITECTURE.md) y [matriz ERP/MES/WMS](docs/product/erp-mes-wms-reconciliation.md). Las transiciones Catalog/Inventory y Production/Manufacturing siguen pendientes de conciliación; esta historia no resuelve esas fronteras ni autoriza reorganizaciones automáticas.

## Historias

1. [x] Como administrador autorizado, quiero registrar productos con datos y estados válidos para utilizarlos en el catálogo.
2. [ ] Como administrador autorizado, quiero registrar materias primas con datos válidos para utilizarlas en mis recetas.
3. [ ] Como administrador autorizado, quiero definir una receta con sus ingredientes y rendimiento para establecer cómo producir un producto. Requiere: #1 y #2.
4. [ ] Como administrador autorizado, quiero crear una orden desde una receta para planificar la producción con las cantidades correspondientes. Requiere: #3.

La división fue aceptada por el usuario. La historia #1 está completada: implementación, pruebas, comprobaciones SQL en Supabase y verificación manual del usuario. Las evidencias de cierre y las advertencias del build están en [plan.md](plan.md), que se conserva hasta pasar a la siguiente historia. Se recomienda `/code-review` antes de integrar la historia.

## Decisiones pendientes de refinamiento

- Definir si las cantidades de ingredientes corresponden a una unidad o a un lote de receta y cómo interviene su rendimiento.
- Definir si se exige disponibilidad de stock al crear la orden en borrador o al liberarla.
- Confirmar los estados esperados de recetas. Los estados de productos y su stock mínimo ya fueron acordados en la historia #1.
- Precisar los contratos públicos necesarios para las fronteras entre módulos ya señaladas por la arquitectura.

## Flujo de trabajo

Refinar con [SKILL_story](skills/story/SKILL_story.md): confirmar módulo propietario, proponer 2–3 criterios y un plan de hasta cinco puntos; si el alcance exige más criterios, proponer dividir la historia. Implementar únicamente después de las aprobaciones indicadas por [SKILL_pair](skills/pair/SKILL_pair.md). Mantener las historias breves según [SKILL_backlog](skills/backlog/SKILL_backlog.md); el contexto general se conserva en [AGENTS.md](AGENTS.md).
