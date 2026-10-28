# Backlog activo: conservar el trabajo al crear materias primas desde compras

## Contexto

Se trabaja en el flujo para crear una materia prima faltante desde una orden de compra en borrador sin perder el trabajo capturado. Esta historia continúa la creación de materias primas con saldos iniciales trazables para CRUMAFOOD.

Stack: el existente en CRUMA, sin cambios propuestos.

Decisiones costosas ya acordadas: una organización CRUMAFOOD y una planta; operación conectada, en español y MXN; autorización global vigente. No agregar campos ni columnas sin consumidor real.

Arquitectura revisada: [ARCHITECTURE.md](ARCHITECTURE.md), [Business Core](docs/architecture/business-core.md) y [matriz ERP/MES/WMS](docs/product/erp-mes-wms-reconciliation.md). Para esta historia, Procurement es responsable de entrega: Purchasing, implementado como `procurement`, es dueño de órdenes y condiciones de compra; Inventory conserva los datos del alta de materia prima y muestra sus errores; `app` coordina salida, retorno y selección. Warehouse es dueño de la operación física, y la ubicación del formulario no cambia esa propiedad lógica.

## Historias activas

No hay historias activas en este momento.

## Historias completadas

- [x] Como administrador autorizado, quiero cancelar el alta o recuperarme de errores y capturas pendientes al crear una materia prima desde compras, para no perder mi trabajo. Las pruebas y el recorrido manual confirmaron cancelación y recarga con captura preservada, retorno del alta exitosa, agregado explícito, rechazo recuperable, persistencia de dos renglones y limpieza de la captura.
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
