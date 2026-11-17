# Backlog de compras, inventario y producción

## Contexto

Se trabaja en CRUMAFOOD con una planta, operación conectada, español, MXN y la autorización global vigente. La unidad base del catálogo ya está definida y protegida. MP-01 y WH-01 quedaron completadas y validadas en desarrollo. MP-02 quedó completada y validada por CI en el PR #129.

Stack: el existente en CRUMA, sin cambios propuestos.

Arquitectura revisada: [ARCHITECTURE.md](ARCHITECTURE.md), [Business Core](docs/architecture/business-core.md) y [matriz ERP/MES/WMS](docs/product/erp-mes-wms-reconciliation.md). Purchasing/Procurement es propietario de órdenes y condiciones comerciales; Warehouse registra la recepción física; Inventory mantiene saldos, lotes y costos; Catalog es propietario de la unidad base. No se duplican materias primas ni se recalculan compras históricas.

## Historias activas

- [ ] **#4.** Como responsable de producción, quiero planificar órdenes con la masa específica, pesar y apartar masa de lotes liberados al iniciar, registrar consumo, piezas reales y destino de sobrantes, para mantener la producción y sus lotes trazables.
  - **Prioridad:** P1.
  - **Motivo:** #3 ya permite definir las recetas; producción necesita ejecutar esas fórmulas con cantidades y lotes reales sin sobreconsumir inventario.
  - **Módulo propietario:** Production. Inventory conserva los saldos y apartados; Quality controla la liberación de lotes.
  - **Requiere:** #3 completada.
  - **Criterios aprobados:** (1) La cantidad estimada de ingredientes escala como `cantidad de receta × piezas planeadas ÷ rendimiento esperado`; planear 50 Party de una receta de 100 piezas y 2 kg de masa estima 1 kg, sin apartarlo hasta iniciar. (2) Al iniciar, el operador selecciona uno o varios lotes liberados de la misma variedad y pesa por lote; la operación aparta las cantidades en forma atómica y dos órdenes concurrentes no pueden apartar más que el saldo disponible. (3) Al cerrar, se registran las piezas reales y el sobrante por lote; el consumo es la diferencia. El sobrante queda fuera del saldo disponible hasta su único destino: incorporarlo a la siguiente preparación de la misma variedad o registrarlo como merma, con resolución al cierre del día y trazabilidad al lote origen.
  - **Prueba de aceptación:** planear 50 piezas; retirar 1,050 g de dos lotes; registrar 48 piezas reales y 150 g de sobrante pesado, con 900 g de consumo calculado. Reincorporar los 150 g una sola vez a la siguiente preparación estándar de 2 kg, registrar por separado sobrante incorporado y peso real (ejemplo esperado: 2.15 kg), y comprobar que el lote solo suma una vez al inventario y queda disponible después de Calidad.
  - **Plan y pruebas:** ciclos de TDD secuenciales en `plan.md`; incluye SQL transaccional y concurrencia. Repartir producto terminado por preparación y condición de almacenamiento queda para una entrega posterior.

- [x] **#3.** Como administrador autorizado, quiero definir recetas de cada producto intermedio y producto final con sus ingredientes, cantidades y rendimiento esperado, para establecer las fórmulas estándar de producción.
  - **Prioridad:** P1.
  - **Motivo:** es el requisito directo para planificar la transformación de la masa; la historia #4 de órdenes de producción depende de esta definición.
  - **Módulo propietario:** Production.
  - **Validación:** CI #4198 aprobó reconstrucción desde cero, migraciones, `production_order_lifecycle.sql`, `db:types:check`, typecheck, lint, pruebas, build y Storybook. En desarrollo se guardaron y consultaron las recetas reales de masa y Tequeños Party de queso; SQL con `ROLLBACK` comprobó restricciones, edición y rechazo sin escrituras parciales; el navegador mostró el rechazo claro y Supabase confirmó que no se creó una orden.

## Historias completadas

- [x] **MP-02.** Como responsable de compras, quiero cambiar el proveedor de una orden borrador conservando sus renglones, para revisar y corregir sus precios antes de confirmarla.
  - **Prioridad:** P2.
  - **Motivo:** cambiar de proveedor es necesario en algunos recorridos, y la alternativa temporal es crear otro borrador.
  - **Módulo propietario:** Procurement.
  - **Validación:** 85 pruebas automatizadas locales en 9 archivos, typecheck y lint focal aprobados; recorrido manual aprobado; prueba SQL aprobada en CI del PR #129 (workflow 4193). Fusionado en `main` como `7fa3bf93`.

- [x] **MP-01.** Como responsable de compras, quiero registrar la presentación y el precio comercial de cada compra y convertir la cantidad a la unidad base de la materia prima, para comparar y recibir compras sin duplicar artículos.
  - **Prioridad:** P1.
  - **Motivo:** completó el recorrido acordado de compra, recepción y valoración comparable antes de continuar con recetas y producción.
  - **Validación:** CI del PR #126 aprobó las verificaciones; el recorrido en Supabase de desarrollo confirmó compra fraccionaria, presentaciones, flete, recepción parcial, rechazo y promedio ponderado. Evidencia en `plan.md`.

- [x] **WH-01.** Como responsable de recepción, quiero consultar desde el móvil las órdenes que admiten recepción y abrir su detalle, para elegir qué compra recibir.
  - **Prioridad:** P1.
  - **Motivo:** un error de consulta impedía al operador navegar a las órdenes pendientes antes de usar recepción en operación.
  - **Módulo propietario:** Warehouse.
  - **Validación:** pruebas automatizadas de consulta, enlace y detalle; recorrido en desarrollo con `PO-20261109-8B53C4`, que mostró 25 kg recibidos y 25 kg pendientes. Los contadores quedan como hallazgo separado.

- [x] Como administrador de catálogo, quiero definir la unidad base de una materia prima y protegerla cuando tenga operaciones asociadas, para evitar reinterpretar sus cantidades históricas. Alta validada en formulario y servidor; referencias directas, polimórficas e indirectas protegidas en Supabase; pruebas de cambio permitido sin referencias y de rechazo atómico; ambas carreras verificadas con dos sesiones para `raw_material_lots` e `inventory_movements`; edición manual de una materia prima heredada con unidad `NULL` conservó la unidad y rechazó una asignación con referencias sin cambios parciales. Fixtures temporales retirados. Los SQL se conectaron a `db:verify`; CI aprobó en el PR #123.
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
