# Backlog de compras, inventario y producción

## Contexto

Se trabaja en CRUMAFOOD con una planta, operación conectada, español, MXN y la autorización global vigente. La unidad base del catálogo ya está definida y protegida. MP-01 y WH-01 quedaron completadas y validadas en desarrollo. MP-02 quedó completada y validada por CI en el PR #129.

Stack: el existente en CRUMA, sin cambios propuestos.

Arquitectura revisada: [ARCHITECTURE.md](ARCHITECTURE.md), [Business Core](docs/architecture/business-core.md) y [matriz ERP/MES/WMS](docs/product/erp-mes-wms-reconciliation.md). Purchasing/Procurement es propietario de órdenes y condiciones comerciales; Warehouse registra la recepción física; Inventory mantiene saldos, lotes y costos; Catalog es propietario de la unidad base. No se duplican materias primas ni se recalculan compras históricas.

## Historias activas

- [x] **#4.** Como responsable de producción, quiero planificar órdenes con la masa específica, pesar y apartar masa de lotes liberados al iniciar, registrar consumo, piezas reales y destino de sobrantes, para mantener la producción y sus lotes trazables.
  - **Prioridad:** P1.
  - **Motivo:** #3 ya permite definir las recetas; producción necesita ejecutar esas fórmulas con cantidades y lotes reales sin sobreconsumir inventario.
  - **Módulo propietario:** Production. Inventory conserva los saldos y apartados; Quality controla la liberación de lotes.
  - **Requiere:** #3 completada.
  - **Criterios aprobados:** (1) La cantidad estimada de ingredientes escala como `cantidad de receta × piezas planeadas ÷ rendimiento esperado`; planear 50 Party de una receta de 100 piezas y 2 kg de masa estima 1 kg, sin apartarlo hasta iniciar. (2) Al iniciar, el operador selecciona uno o varios lotes liberados de la misma variedad y pesa por lote; la operación aparta las cantidades en forma atómica y dos órdenes concurrentes no pueden apartar más que el saldo disponible. (3) Al cerrar, se registran las piezas reales y el sobrante por lote; el consumo es la diferencia. El sobrante queda fuera del saldo disponible hasta su único destino: incorporarlo a la siguiente preparación de la misma variedad o registrarlo como merma, con resolución al cierre del día y trazabilidad al lote origen.
  - **Prueba de aceptación:** planear 50 piezas; retirar 1,050 g de dos lotes; registrar 48 piezas reales y 150 g de sobrante pesado, con 900 g de consumo calculado. Reincorporar los 150 g una sola vez a la siguiente preparación estándar de 2 kg, registrar por separado sobrante incorporado y peso real (ejemplo esperado: 2.15 kg), y comprobar que el lote solo suma una vez al inventario y queda disponible después de Calidad.
  - **Validación:** CI #4224 aprobó reconstrucción limpia, migraciones, SQL/RLS, tipos generados, typecheck, lint, pruebas, build y Storybook. El usuario confirmó la fusión del PR #132 y el recorrido manual en desarrollo; la inspección de Calidad usó datos de prueba.

- [x] **#5.** Como responsable de inventario y preparación de pedidos, quiero separar por lote los saldos frescos, crudos congelados y apartados, para congelar, resolver interrupciones y surtir pedidos desde la condición elegida con trazabilidad.
  - **Prioridad:** P1.
  - **Motivo:** el picking y las reservas deben reconocer la condición física; los apartados de congelación deben salir de la disponibilidad y dos operaciones concurrentes no pueden comprometer las mismas piezas.
  - **Módulo propietario:** Inventory mantiene los saldos y movimientos; Warehouse ejecuta picking; Quality conserva los criterios de conservación.
  - **Requiere:** #4 completada.
  - **Criterios aprobados:** (1) iniciar congelación aparta cantidad entera del saldo fresco del lote y del disponible del producto tras proteger reservas; el apartado queda fuera de reservas y picking. (2) decisiones parciales registran lote, cantidad, destino, motivo, responsable y fecha; solo se devuelve a fresco el saldo aún pendiente con verificación autorizada de que no se congeló y conservó condiciones. Las piezas confirmadas como congeladas no pueden reclasificarse por ubicación, edición de lote ni picking; los pendientes siguen apartados y cada reintento idempotente no duplica movimientos. (3) picking selecciona fresco o crudo congelado, aplica FEFO dentro de la condición, muestra faltantes y valida disponibilidad en servidor; los productos sin condición conservan el flujo actual.
  - **Prueba de aceptación:** de 48 piezas frescas apartar 24; confirmar 10 congeladas, devolver 8 a fresco y dejar 6 apartadas (32/10/6). Surtir 4 congeladas para quedar 32/6/6; rechazar el intento de surtir 7 sin cambios. Una vez resueltas las 6 pendientes, rechazar el retorno a fresco de una pieza ya congelada sin modificar saldos ni movimientos. Probar FEFO con varios lotes, reintentos, dos congelaciones concurrentes y la carrera congelación/reserva.
  - **Plan y pruebas:** ciclos secuenciales documentados en `plan.md`; SQL transaccional, RLS, FEFO, idempotencia y concurrencia en dos sesiones. Reglas automáticas de condición por ruta quedan fuera y se refinarán en una historia posterior.
  - **Validación:** PR #133 fusionado como `52fdc9b0`; CI #4236 pasó database, build y Storybook. Recorrido manual de desarrollo confirmado: 48 → 24/0/24 → 32/10/6 → 32/6/6; picking de 4 congeladas y rechazo visual de 7 por faltar 1. La consulta confirmó las 4 asignadas como `raw_frozen` al lote de armado. Las 6 piezas apartadas siguen pendientes de disposición.

- [x] **#3.** Como administrador autorizado, quiero definir recetas de cada producto intermedio y producto final con sus ingredientes, cantidades y rendimiento esperado, para establecer las fórmulas estándar de producción.
  - **Prioridad:** P1.
  - **Motivo:** es el requisito directo para planificar la transformación de la masa; la historia #4 de órdenes de producción depende de esta definición.
  - **Módulo propietario:** Production.
  - **Validación:** CI #4198 aprobó reconstrucción desde cero, migraciones, `production_order_lifecycle.sql`, `db:types:check`, typecheck, lint, pruebas, build y Storybook. En desarrollo se guardaron y consultaron las recetas reales de masa y Tequeños Party de queso; SQL con `ROLLBACK` comprobó restricciones, edición y rechazo sin escrituras parciales; el navegador mostró el rechazo claro y Supabase confirmó que no se creó una orden.

- [ ] **#6.** Como responsable de Calidad, quiero calcular y apartar las muestras de producto crudo congelado por lote, registrar su destino y consultar la retención, para inspeccionar sin liberar muestras como inventario disponible.
  - **Prioridad:** P1.
  - **Motivo:** antes de habilitar saldo crudo congelado para reservas o picking, deben apartarse las muestras aprobadas y quedar trazables sus destinos; omitirlo sobrestima el inventario disponible.
  - **Módulo propietario:** Quality; Inventory mantiene saldos, custodia y movimientos; Production aporta la orden y salida de origen.
  - **Requiere:** #5 completada.
  - **Criterios aprobados:** (1) Para tequeños y empanadas crudos congelados, cada lote/producto/relleno/preparación aparta una sola vez 2 piezas para inspección inmediata y 3 para retención; Nueva inspección muestra ambas cantidades y unidades en solo lectura. El lote de inventario se vincula cuando se identifica y la orden conserva la producción bruta. (2) Las muestras pueden volver intactas al mismo lote con autorización de Calidad, registrarse como merma directa, quedar en custodia o pendientes de disposición; cada cantidad conserva origen, destino, fecha y responsable y se descuenta una sola vez. (3) La consulta muestra custodia al cierre diario y el indicador mensual usa muestras intactas en custodia de lotes producidos ese mes sobre la producción bruta de la misma preparación y condición; para crudo congelado, cuenta como denominador las piezas confirmadas en esa condición antes del apartado. La merma directa aparece aparte y la meta es 0.1 %–0.5 %.
  - **Caso de aceptación:** una salida de 48 tequeños Party crudos congelados aparta 2 + 3 antes de habilitar el congelado. Si las 2 piezas intactas vuelven, quedan 45 liberables y 3 en custodia; si se consumen en la prueba, quedan 43 liberables, 2 de merma directa y 3 en custodia. Confirmaciones parciales y reintentos no duplican el apartado.
  - **Regla aprobada:** las confirmaciones parciales se acumulan por lote; menos de cinco piezas confirmadas permanecen apartadas y fuera de reservas/picking. Al llegar a cinco, se reservan 2 para inspección inmediata y 3 para retención en una sola operación; solo el excedente queda disponible. Un lote que cierre con menos de cinco queda apartado para disposición de Calidad. Cada lote se evalúa por separado.

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
