# Backlog activo: ajustes de materias primas por lote

## Contexto

Se trabaja en CRUMAFOOD con una planta, operación conectada, español, MXN y la autorización global vigente. Las entradas físicas y el stock inicial continúan registrándose mediante órdenes de compra y recepción; los ajustes de esta historia corrigen diferencias de cantidad en lotes disponibles existentes.

Stack: el existente en CRUMA, sin cambios propuestos.

Arquitectura revisada: [ARCHITECTURE.md](ARCHITECTURE.md), [Business Core](docs/architecture/business-core.md) y [matriz ERP/MES/WMS](docs/product/erp-mes-wms-reconciliation.md). Inventory es propietario de movimientos, saldos, lotes y ajustes; Warehouse aporta el contexto físico de ubicación. No se agregan tablas para esta historia ni se reinterpretan movimientos históricos `adjustment`.

## Historias activas

No hay historias activas en este momento.

## Historias completadas

- [x] Como responsable de inventario, quiero corregir con un motivo la cantidad de un lote disponible, para mantener coherentes sus existencias y su historial de movimientos. Las pruebas SQL en Supabase cubrieron promedio ponderado, disminución, agotamiento, autorización, validaciones, precisión de cuatro decimales y rollback; el recorrido manual verificó aumento y disminución por lote con saldo, costos y kardex conciliados.
- [x] Como administrador autorizado, quiero cancelar el alta o recuperarme de errores y capturas pendientes al crear una materia prima desde compras, para no perder mi trabajo. Las pruebas y el recorrido manual confirmaron cancelación y recarga con captura preservada, retorno del alta exitosa, agregado explícito, rechazo recuperable, persistencia de dos renglones y limpieza de la captura.
- [x] Como administrador autorizado, quiero registrar por lote y ubicación la materia prima recibida de una orden de compra para reflejar lo que llegó y actualizar las existencias.
- [x] Como administrador de inventario, quiero que una materia prima nueva empiece con stock y costo promedio en cero y continuar a compras según el origen del alta, para registrar existencias de forma trazable. La alta desde catálogo conserva confirmación y acceso a compras; desde una orden borrador regresa con el material seleccionado, sin crear el renglón. Las pruebas aprobadas pasan.

## Candidatos para historias separadas, aún sin refinar

- Código interno inconsistente.
- Slug manual.
- Categorías mezcladas.
- Familia vacía.
- Campos faltantes.
