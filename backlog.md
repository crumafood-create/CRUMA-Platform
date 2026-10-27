# Backlog activo

## Contexto

Se trabaja en la creación de materias primas con saldos iniciales trazables para CRUMAFOOD. Una materia prima nueva comienza sin stock ni costo promedio; el saldo físico se registra mediante una orden de compra, recepción por lote y liberación de Calidad.

Stack: el existente en CRUMA, sin cambios propuestos.

Decisiones vigentes: una organización y una planta; operación conectada, en español y MXN; autorización global existente. No agregar campos ni columnas sin consumidor real.

Arquitectura revisada: [ARCHITECTURE.md](ARCHITECTURE.md), [Business Core](docs/architecture/business-core.md) y [matriz ERP/MES/WMS](docs/product/erp-mes-wms-reconciliation.md).

## Historias activas

No hay historias activas en esta conversación.

## Historias pendientes de refinar

1. [ ] Como administrador autorizado, quiero cancelar el alta o recuperarme de errores y capturas pendientes al crear una materia prima desde compras, para no perder mi trabajo.

## Historia completada

- [x] Como administrador autorizado, quiero registrar por lote y ubicación la materia prima recibida de una orden de compra para reflejar lo que llegó y actualizar las existencias.
- [x] Como administrador de inventario, quiero que una materia prima nueva empiece con stock y costo promedio en cero y continuar a compras según el origen del alta, para registrar existencias de forma trazable. La alta desde catálogo conserva confirmación y acceso a compras; desde una orden borrador regresa con el material seleccionado, sin crear el renglón. Las pruebas aprobadas pasan.

## Verificación de integración pendiente

- Recorrer en desarrollo compra → recepción → Calidad con cantidades conocidas y confirmar la diferencia entre existencias físicas y disponibles, sin duplicar movimientos al liberar el lote.

## Candidatos para historias separadas, aún sin refinar

- Código interno inconsistente.
- Slug manual.
- Categorías mezcladas.
- Familia vacía.
- Campos faltantes.
