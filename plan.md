# Plan de historias de CRUMAFOOD

## MP-01 completada: comprar presentaciones comerciales y convertirlas a unidad base

### Historia

Como responsable de compras, quiero registrar la presentación y el precio comercial de cada compra y convertir la cantidad a la unidad base de la materia prima, para comparar y recibir compras sin duplicar artículos.

### Módulo propietario y fuentes de verdad

**Purchasing/Procurement** es propietario de las órdenes, presentaciones y condiciones comerciales. **Catalog** mantiene la unidad base. **Warehouse** registra la recepción física y la aceptación o rechazo explícitos. **Inventory** conserva lotes, saldos y valoración. El flujo coordina estos datos sin crear escritores competidores.

### Criterios de aceptación aprobados

- [x] Dada una orden en borrador, cuando se agrega una materia prima en su unidad base o en una presentación comercial conocida al comprar, entonces el renglón conserva la presentación y el precio acordados para esa compra, convierte la cantidad a la unidad base, muestra el importe comercial como referencia y permite comparar su costo por kg o litro. La compra directa en unidad base admite cantidades fraccionarias; las presentaciones cerradas requieren unidades enteras. El cálculo usa la precisión existente y no reconstruye el importe desde un costo unitario previamente redondeado.
- [x] Dada una orden con presentación solicitada, cuando se registra una recepción parcial, entonces solo las cantidades aceptadas explícitamente y conformes con la presentación solicitada se contabilizan como recibidas; un bulto abierto o incompleto puede rechazarse y queda pendiente la cantidad no recibida. No se crea un subsistema de rechazos sin revisar el mecanismo existente.
- [x] Dada una orden con flete, cuando se agregan, modifican o retiran renglones, entonces se conserva el flete y el total se recalcula como productos más flete. El flete no afecta el costo promedio de inventario; las compras anteriores conservan su interpretación en unidad base y sus importes históricos.

### Reglas de negocio fijadas

- La presentación varía por compra y cada materia prima aparece como máximo en una presentación por orden. La misma materia prima puede comprarse a varios proveedores, pero cada orden tiene un solo proveedor.
- El precio se captura por presentación; el contenido de la presentación se conoce al comprar (por ejemplo, 2 bultos de 25 kg equivalen a 50 kg). No se crean materias primas por empaque.
- Se permiten compras directas en unidad base con cantidad fraccionaria; las cantidades de presentaciones cerradas son enteras.
- Se permiten recepciones parciales. Solo una confirmación explícita de aceptación incrementa lo recibido; presentaciones abiertas o incompletas se rechazan y mantienen saldo pendiente.
- No se usan descuentos. Cada compra tiene un importe de flete que puede ser cero. Total = importe de productos + flete; el promedio de inventario usa el costo del producto convertido a la unidad base y excluye el flete.
- Cambiar el proveedor en una orden borrador conserva los renglones para revisión y corrección manual de precios; no recalcula precios. Una orden confirmada no se modifica: la alternativa temporal es crear otro borrador.
- Los renglones históricos existentes se interpretan en unidad base, sin asignarles presentaciones ni recalcular sus importes.

### Plan aprobado

1. Seguir el recorrido existente de renglones de compra, recepción, lotes y valoración; confirmar productores, consumidores, permisos, precisión y mecanismo vigente de rechazo físico.
2. Capturar por renglón la presentación y su contenido junto con el precio comercial de esa compra; convertir a cantidad base conservando el importe del producto como referencia y mostrando el costo equivalente por kg/litro con la precisión existente.
3. Proteger validaciones y cálculos en servidor/base de datos para que cantidad, conversión, importe y totales se guarden coherentemente; conservar cambios de renglones y flete dentro del total de la orden.
4. Integrar recepción parcial y decisión explícita de aceptar o rechazar la presentación solicitada; solo lo aceptado se contabiliza y el saldo restante queda pendiente.
5. Preservar los renglones históricos y verificar el recorrido con pruebas enfocadas y navegador, separando las pruebas locales, SQL, cálculos de costos y validación manual.

### Pruebas aprobadas

| Caso | Capa |
|---|---|
| Compra directa en unidad base con cantidad fraccionaria | Formulario/contrato de renglón |
| Presentación cerrada con unidades enteras y conversión (2 × 25 kg = 50 kg) | Formulario/servidor y persistencia |
| División no exacta: importe comercial no reconstruido desde costo unitario redondeado | Contrato/RPC o integración SQL |
| Recepción parcial, aceptación explícita y rechazo de presentación abierta o incompleta | Flujo de recepción y SQL |
| Agregar, modificar y retirar renglones conserva el flete y recalcula productos + flete | Integración de orden de compra |
| Flete excluido del costo promedio y costos basados en precio del producto convertido | Integración Inventory/SQL |
| Renglones históricos mantienen unidad base e importes existentes | Integración SQL |
| Recorrido completo de compra y recepción con valores conocidos | Verificación manual en navegador |

### Fuera de alcance

- MP-02, que permanece pendiente como P2; no modificar órdenes confirmadas.
- Recetas y órdenes de producción.
- Descuentos, múltiples proveedores en una orden y cambios de conversiones históricas.
- Recalcular compras antiguas o asignarles presentaciones inventadas.

### Estado de ejecución

- Implementación integrada por PR #126 en `main` (`08bce90f`).
- CI aprobó typecheck, lint, pruebas, build, `db:verify` (reconstrucción, migración, prueba SQL de presentaciones y tipos generados) y Storybook.
- La migración `20261108010000_add_purchase_order_presentations.sql` se aplicó en Supabase de desarrollo `poglpqvmbrfcvtuspvtx` el 2026-11-09, tras reconciliar el historial con autorización explícita.
- Recorrido manual de compra, recepción y Calidad completado en desarrollo el 2026-11-09; evidencia y valores abajo.
- El promedio observado de $28.1667/kg coincide con incorporar 25 kg a $30/kg al saldo previo de 5 kg a $19/kg. MP-02 permanece pendiente como P2.


### Evidencia manual MP-01 (2026-11-09)

| Caso | Resultado observado en Supabase de desarrollo `poglpqvmbrfcvtuspvtx` |
|---|---|
| Compra directa fraccionaria | `PO-20261109-019593` (`d375f138-c49f-40f7-aab9-54f42358237d`): 2.5 kg a $19/kg, importe/total $47.50. La cantidad fraccionaria se guardó. |
| Presentación comercial y flete | `PO-20261109-8B53C4` (`33d768a9-5fe0-47cf-a3af-b29042d1b630`): 2 bultos × 25 kg a $750 = 50 kg y $1,500 de producto; $100 de flete dieron total $1,600. Cambiar temporalmente a $800 conservó flete y recalculó total a $1,700; al restaurar $750 volvió a $1,600 antes de liberar. |
| Recepción parcial y rechazo | Se aceptó un lote de 25 kg a $30/kg en cuarentena (`MP01-MANUAL-LOT-20261109-A`, `057fa979-ece1-4560-a433-5c0c2522c2fa`). Quedaron 25 kg pendientes. La presentación incompleta rechazada no generó otro lote y siguió pendiente. |
| Liberación de Calidad y promedio | Antes: 5 kg, promedio $19/kg, `last_cost` $19/kg. Tras liberar 25 kg a $30/kg: saldo 30 kg, promedio $28.1667/kg, `last_cost` y costo del lote $30/kg. El flete de $100 no se incorporó al costo promedio. |

## MP-02 completada: cambiar el proveedor de un borrador

### Historia y propiedad

Como responsable de compras, quiero cambiar el proveedor de una orden borrador conservando sus renglones, para revisar y corregir sus precios antes de confirmarla. **Procurement** es el módulo propietario de órdenes, proveedores y condiciones comerciales.

### Criterios aprobados

- [x] Dada una orden borrador con renglones, cuando se guarda otro proveedor disponible, entonces la orden conserva sus renglones, precios, importes, flete y total.
- [x] Dada una orden borrador después de cambiar proveedor, cuando se corrige manualmente el precio de un renglón, entonces el sistema recalcula productos + flete; cambiar proveedor por sí solo no recalcula los precios.
- [x] Dada una orden cuyo estado ya no es `draft`, cuando se intenta cambiar el proveedor, entonces se rechaza la operación y no se modifica la orden.

### Plan y pruebas aprobados

1. Añadir el selector de proveedor disponible al detalle de la orden en borrador; conservar lectura sin controles de edición fuera de `draft`.
2. Validar autorización y proveedor con la regla vigente; actualizar solo `supplier_id` y `updated_at`, condicionando la escritura a `status = draft` y exigiendo que se afecte/retorne una fila.
3. Comprobar mediante prueba de persistencia que cambiar proveedor mantiene todos los renglones y valores monetarios; cubrir proveedor no disponible y orden no borrador.
4. En una prueba independiente, cambiar manualmente el precio con cantidad y presentación constantes y comprobar el total de productos más flete.
5. Ejecutar pruebas locales y CI; recorrer el flujo en navegador cuando esté disponible. Registrar pruebas locales, SQL/CI y recorrido manual por separado.

### Fuera de alcance

No cambiar proveedor en órdenes confirmadas; no modificar precios automáticamente al cambiar proveedor; no permitir más de un proveedor por orden. Para una compra confirmada con otro proveedor, la alternativa vigente es crear otro borrador.

### Cierre y evidencia (2026-11-10)

- Implementados el contrato de captura, la acción protegida por `procurement.order.manage`, la validación del proveedor activo/no eliminado, la escritura limitada a `supplier_id` y `updated_at` con condición `draft` y verificación de fila afectada, y el selector del detalle solo para borradores.
- Pruebas automatizadas locales focales y adyacentes: 85 aprobadas en 9 archivos; typecheck, lint focal y `git diff --check` aprobados. `supabase/tests/database/purchase_order_presentations.sql` ahora contiene casos separados de conservación de renglones/valores al cambiar proveedor y de corrección manual de precio conservando flete; el SQL no se ejecutó localmente.
- Recorrido manual en `localhost:3000`: borrador `PO-20261110-C9CA18`, con un renglón de 2.5 kg a $19/kg ($47.50) y flete de $100 (total $147.50). Se cambió de Antojos to go a `Proveedor prueba MP-02 20261110`; la orden y la lista conservaron renglón e importes. Al cambiar manualmente el precio a $20, productos subió a $50 y total a $150, con flete en $100; al restaurar $19, el total volvió a $147.50.
- Recorrido manual de estado no editable: la orden parcialmente recibida `PO-20261109-8B53C4` muestra Antojos to go sin control Guardar proveedor.
- CI del PR #129 aprobó incluyendo la ejecución de `supabase/tests/database/purchase_order_presentations.sql` sobre el commit `6c56f840`; workflow 4193 terminó en éxito. El PR se fusionó en `main` como `7fa3bf93`.
- MP-02 queda completada. El proveedor temporal y la orden borrador se conservan en el entorno de prueba; no se liberó ni recibió esta orden.


---

## Historia completada: definir y proteger la unidad base de materias primas

### Historia

Como administrador de catálogo, quiero definir la unidad base de una materia prima y protegerla cuando tenga operaciones asociadas, para evitar reinterpretar sus cantidades históricas.

### Módulo propietario

**Catalog**, según `docs/architecture/business-core.md`: es propietario de las unidades base y datos maestros. Inventory conserva la propiedad de movimientos, saldos y lotes. No se moverán archivos en esta historia; la ubicación actual del formulario y contrato queda como deuda documentada.

### Criterios de aceptación aprobados

- [x] Dado que se crea una materia prima, cuando se guarda, entonces el formulario exige una unidad base activa y no eliminada, el servidor vuelve a validarla y la materia prima se guarda con ella; una solicitud sin unidad o con una unidad inválida se rechaza. Pruebas locales del formulario, repositorio y acción aprobadas.
- [x] Dada una materia prima con referencias operativas, cuando se intenta cambiar o quitar su unidad base, entonces la operación se rechaza en la base de datos y conserva íntegro el registro, incluidos los demás datos enviados en esa actualización. Si se guarda otro dato sin cambiar la unidad, la edición se permite, incluso cuando la unidad histórica sea `NULL`. Fixtures SQL ejecutados manualmente; navegador confirmó edición sin cambiar unidad y rechazo sin actualización parcial.
- [x] Dada una materia prima sin referencias operativas, cuando se le asigna o cambia a una unidad válida, entonces el cambio se guarda. La comprobación de referencias y la mutación están protegidas frente a operaciones concurrentes; una consulta previa solo desde la aplicación no satisface el criterio. El fixture SQL de unidad sin referencias pasó; las carreras `raw_material_lots` e `inventory_movements` se probaron en ambas direcciones con dos sesiones.

### Referencias operativas que bloquean cambiar o asignar la unidad

La comprobación contempla registros existentes sin filtrar por estado, borrado lógico, cantidad actual o saldo: un borrador, un histórico, un lote agotado o una línea con cantidad cero siguen siendo una referencia.

#### Referencias directas

| Tabla | Relación con la materia prima | Motivo |
|---|---|---|
| `purchase_requisition_items` | `raw_material_id` | Conserva cantidades requeridas, disponibles y de compra; incluye requisiciones en borrador e históricas. |
| `purchase_order_items` | `raw_material_id` | Conserva cantidad, costo y cantidad recibida; incluye órdenes en cualquier estado, también borradores. |
| `recipe_items` | `raw_material_id` | Conserva el ingrediente y cantidad de recetas. |
| `production_order_items` | `raw_material_id` | Conserva cantidades planeadas y consumidas en órdenes de producción. |
| `production_lot_consumptions` | `raw_material_id` | Registro histórico de consumo por lote de producción. |
| `production_lot_traceability` | `raw_material_id` | Conserva trazabilidad y cantidad consumida desde el lote de materia prima. |
| `raw_material_lots` | `raw_material_id` | Conserva cantidad, costo, ubicación y estado del lote, incluso en cero o agotado. |

#### Referencias polimórficas

| Tabla | Condición |
|---|---|
| `inventory_movements` | `item_type = 'raw_material' AND item_id = raw_material.id` |
| `inventory_lots` | `item_type = 'raw_material' AND item_id = raw_material.id` |
| `inventory_reservations` | `item_type = 'raw_material' AND item_id = raw_material.id`; incluir reservas de cualquier estado. |

#### Referencias indirectas mediante pedido o lote

| Tabla | Relación |
|---|---|
| `purchase_receipt_items` | `purchase_order_item_id` enlaza con `purchase_order_items.raw_material_id`; `raw_material_lot_id` enlaza con `raw_material_lots.raw_material_id`. Conserva cantidades recibidas. |
| `production_order_consumptions` | `raw_material_lot_id` enlaza con `raw_material_lots.raw_material_id`; conserva cantidades consumidas. |
| `production_material_consumption_operations` | `raw_material_lot_id` enlaza con `raw_material_lots.raw_material_id`; conserva operaciones de consumo e idempotencia. |
| `quality_inspections` y `quality_release_decisions` | Sus referencias a `raw_material_lots` identifican materia prima e inspección/liberación históricas. |

La tabla `recipes` representa recetas y su propia unidad de rendimiento; no identifica ingredientes. Los ingredientes consumidos por este flujo están en `recipe_items`. La columna `raw_materials.unit_of_measure_id` tiene una FK a `units_of_measure`; no se modificará ni completará automáticamente para datos existentes.

### Plan aprobado

1. En el formulario de alta, exigir una unidad seleccionada. En el contrato/servidor, exigir y comprobar que el ID corresponde a una unidad activa y no eliminada antes de insertar.
2. Permitir ediciones sin cambio de unidad, incluyendo materiales históricos con `unit_of_measure_id IS NULL`. El envío de la unidad igual a la existente no cuenta como cambio.
3. Proteger en la base de datos el cambio o asignación de unidad con referencias. El guardado rechazado debe ser atómico y conservar tanto la unidad como todos los demás campos del registro.
4. Hacer que el bloqueo y la creación de nuevas referencias se serialicen de modo que una carrera concurrente no permita cambiar la unidad mientras otra transacción agrega una referencia.
5. No migrar unidades faltantes, reinterpretar cantidades, agregar campos/tablas, rediseñar conversiones ni mover archivos. Los materiales históricos con unidad nula y referencias no reciben una unidad en esta historia.

### Pruebas aprobadas y evidencia

| Nombre de prueba | Capa responsable |
|---|---|
| `rawMaterialForm_requiresBaseUnitOnCreate` | Componente del formulario |
| `fetchRawMaterialFormCatalog_excludesInactiveOrDeletedUnits` | Repositorio de catálogo |
| `createRawMaterial_rejectsMissingOrInvalidUnitWithoutInsert` | Acción/servidor |
| `updateRawMaterial_omitsUnitFieldWhenNotSubmitted` | Acción/servidor |
| `rawMaterialCatalogEdit_preservesLegacyNullUnitWithOperationalReferences` | Integración de base de datos/Supabase |
| `rawMaterialUnitChange_rejectsLotReferenceAndPreservesWholeRow` | Integración de base de datos/Supabase |
| `rawMaterialUnitChange_rejectsPolymorphicReferencesByTypeAndPreservesWholeRow` | Integración de base de datos/Supabase |
| `rawMaterialUnitChange_rejectsProcurementAndReceiptReferencesAndPreservesWholeRow` | Integración de base de datos/Supabase |
| `rawMaterialUnitChange_rejectsRecipeAndProductionReferencesAndPreservesWholeRow` | Integración de base de datos/Supabase |
| `rawMaterialUnitChange_preservesEntireRowWhenRejected` | Integración de base de datos/Supabase |
| `rawMaterialUnitChange_allowsValidUnitWhenUnreferenced` | Integración de base de datos/Supabase |
| `rawMaterialUnitChangeAndReferenceCreation_areSerialized` | Integración concurrente de base de datos; validación manual en dos sesiones SQL de Supabase si no hay runner concurrente disponible |
| `rawMaterialEdit_preservesLegacyNullUnitUnlessExplicitlyChanged` | Recorrido manual de navegador |

Las pruebas de referencias se dividen en tres grupos; cada caso de relación intenta cambiar y quitar la unidad junto con otros campos, y verifica que la fila completa permanezca intacta. Los casos polimórficos usan el mismo `item_id` con el tipo correcto y con otro discriminador para probar ambos resultados.

| Grupo | Relaciones | Estado |
|---|---|---|
| 1. Lotes y referencias polimórficas | `raw_material_lots`; `inventory_movements`, `inventory_lots` e `inventory_reservations` con `item_type` correcto/incorrecto | Fixtures de las tres referencias polimórficas ejecutados manualmente tras instalar triggers; los tipos incorrectos con el mismo ID no bloquean. Concurrencia en `raw_material_lots` e `inventory_movements`: ambas direcciones observadas con dos sesiones; referencia primero rechazó el cambio con `23514`, unidad primero hizo esperar la referencia hasta el `COMMIT`. Los diez triggers quedaron verificados mediante catálogo de PostgreSQL. |
| 2. Compras y recepción | `purchase_requisition_items`, `purchase_order_items`, `purchase_receipt_items` | Fixtures de requisición y orden de compra repetidos después de instalar triggers, sin error. El fixture de recepción se enlazó a orden, renglón, lote y ubicación; sus relaciones obligatorias están protegidas por esos registros fuente. Concurrencia cubierta mediante el helper compartido probado en `raw_material_lots` e `inventory_movements`. |
| 3. Recetas y producción | `recipe_items`, `production_order_items`, `production_lot_consumptions`, `production_lot_traceability`, `production_order_consumptions`, `production_material_consumption_operations`, `quality_inspections`, `quality_release_decisions` | Fixtures de recetas, renglones de producción, consumos y trazabilidad ejecutados manualmente; los cuatro fixtures directos se repitieron tras instalar triggers, sin error. Las relaciones indirectas se verificaron por sus renglones y lotes fuente. La prueba de historial de Calidad pasó. Concurrencia cubierta mediante el helper compartido probado en ambas clases de referencia, directa y polimórfica. |

La prueba de acción `updateRawMaterial_omitsUnitFieldWhenNotSubmitted` comprueba el contenido del `UPDATE` simulado: cambia un campo de catálogo y omite `unit_of_measure_id`. No demuestra persistencia de `NULL`; `rawMaterialCatalogEdit_preservesLegacyNullUnitWithOperationalReferences` la verificará en la capa de base de datos.

La lista fue aprobada y ejecutada por ciclos TDD. Las pruebas locales del formulario, consulta de unidades, acción y contrato pasan. Los scripts SQL se ejecutaron manualmente en Supabase de desarrollo y usan `ROLLBACK`, salvo los fixtures temporales creados para las carreras y el navegador. Las migraciones `20261105000000` a `20261107030000` se aplicaron manualmente en Supabase; se verificó la instalación de los diez triggers. Las dos carreras se observaron en sesiones SQL independientes para una referencia directa y una polimórfica. En navegador, editar la descripción de un material heredado con unidad `NULL` y lote agotado fue exitoso; intentar asignar `kg` mostró el rechazo y Supabase confirmó que descripción, unidad, saldos y lote no cambiaron. La prueba `raw_material_unit_change_without_references.sql` pasó. Los registros persistentes de prueba se retiraron de Supabase. Los scripts SQL quedaron conectados a `db:verify`; CI aprobó en el PR #123.

### Fuera de alcance

- Asignación masiva o automática de unidades a registros existentes sin unidad.
- Asignar unidad a un registro heredado con referencias operativas; requiere decisión posterior.
- Unidades de compra, presentaciones y conversiones entre unidades.
- Cambios a unidades base de productos o recetas.
- Reorganización de módulos o ubicación de archivos.


## BD-01 completada: diferir la jerarquía de organización y planta

### Alcance y evidencia

- Operación de esta versión: una organización CRUMAFOOD y una planta; no desarrollar administración de sucursales ni franquicias.
- La consulta remota de solo lectura confirmó `organizations` y `plants` ausentes; `warehouses` existe sin `tenant_id`, `plant_id`, restricciones ni índices asociados.
- `warehouses`, `tenants`, `tenant_members` y la autorización global `user_roles` se conservan.
- No se encontraron consumidores operativos de la jerarquía. El inventario de RLS, los tipos y las pruebas dedicadas sí la reflejaban.

### Cambio integrado y validado

- Conservar `20261002140000_add_operational_scope_hierarchy.sql` intacta.
- La sucesión propuesta de ADR-0017 es parcial: preserva tenant técnico y todas las reglas vigentes de autorización (`user_roles` como autoridad efectiva); la activación futura de otros scopes permanece bloqueada.
- La corrección `20261107080000` requiere que la migración histórica `20261002140000` haya corrido primero. No debe ejecutarse directamente en el remoto actual mientras falte el historial.
- CI en PR #125 aprobó la reconstrucción desde cero, SQL/RLS del estado final, autorización y almacenes, y la comprobación de tipos generados; build y Storybook también pasaron.
- La validación aislada reprodujo el error transaccional y cubrió cinco escenarios de retiro/rechazo y rollback ante fallo tardío de DDL. Los tipos completos se recuperaron del artefacto generado por CI, sin edición manual.
- PR #125 quedó fusionado en `72d21639`. No se ejecutaron `migration repair` ni `db push` en Supabase activo.
- La migración `20261107080000_defer_operational_hierarchy.sql` bloquea las relaciones, aborta si encuentra filas/asignaciones y elimina solo las tablas, columnas, constraints, índices y políticas de la jerarquía. No usa `CASCADE`.
- La prueba `operational_scope_deferred.sql` comprueba el esquema final y que se conservan almacenes, tenants, membresías y `user_roles`; `db:verify` la ejecuta después de la reconstrucción.
- ADR-0018 es una propuesta sucesora de ADR-0017, no una decisión arquitectónica aceptada.

### Pendientes independientes

- ADR-0018 permanece Propuesto; su aceptación no se registra automáticamente por la fusión del PR.
- La reparación del historial remoto y el `db push` siguen pendientes de autorización independiente.

## WH-01 completada: recuperar la lista móvil de recepción

El propietario es Warehouse. `getReceivingOrders()` consultaba columnas inexistentes (`supplier_name`, `total_items`, `received_items`) y filtraba estados heredados (`pending`, `partial`) en vez de los estados vigentes de compras (`released`, `partially_received`).

La lista ahora usa la consulta Supabase tipada, la relación de proveedor, excluye órdenes eliminadas y filtra los dos estados que admiten recepción. Las tarjetas enlazan al detalle. Se retiró de la tarjeta el bloque basado en contadores no disponibles; los contadores del detalle permanecen sin cambios y como hallazgo separado.

Pruebas automatizadas: 3 nuevas pruebas para la orden parcial de prueba, su enlace y el detalle con 25 kg recibidos/25 kg pendientes; 5 pruebas existentes de recepción aprobadas. Typecheck y ESLint enfocado aprobados.

Verificación manual en desarrollo: `/mobile/receiving` mostró `PO-20261109-8B53C4` (Antojos to go, parcialmente recibida); al abrirla, el detalle mostró 50 kg esperados, 25 kg recibidos y 25 kg pendientes. Se observaron también `Avance 0 / 1`, `Partidas recibidas 0` y `Pendientes 1`; su interpretación no se incluyó en WH-01.

## Recetas #3 activa: definir recetas de masa y productos finales

### Historia propuesta

Como administrador autorizado, quiero definir recetas de cada producto intermedio y producto final con sus ingredientes, cantidades y rendimiento esperado, para establecer las fórmulas estándar de producción.

**Propietario: Production**, conforme a `docs/architecture/business-core.md` (recetas, rendimiento, órdenes y consumos). Los productos y sus unidades base siguen siendo datos de Catalog.

### Modelo actual y cambio mínimo propuesto

- `recipes` ya asocia una fórmula con su producto de salida (`product_id`) y guarda `yield_quantity` y `unit_of_measure_id`. Cada variedad de masa será un producto de catálogo distinto con su propia receta; la fórmula de la masa actual tendrá unidad kg y rendimiento estándar 2.
- `products` ya incluye `unit_of_measure_id`; no hace falta agregar otra unidad al producto ni una tabla de empaques.
- Fórmula real confirmada por el usuario para el lote estándar de masa: **530 g de agua, 30 g de sal, 30 g de azúcar, 180 g de margarina y 1,230 g de harina de trigo**, total **2,000 g = 2 kg**. Para este conjunto de ingredientes pesados, se acordó usar **kg como unidad base común**; en receta equivale a 0.53 kg de agua, 0.03 kg de sal, 0.03 kg de azúcar, 0.18 kg de margarina y 1.23 kg de harina. El recorrido de navegador en desarrollo mostró las cinco materias primas activas con unidad kg.
- Al preparar el recorrido, el catálogo mostró 30 kg de Harina de trigo con costo promedio $28.17/kg. Agua, Sal, Azúcar y Margarina quedaron con stock y costo cero; el stock inicial físico sigue fuera de esta historia.
- Tequeño Party de queso: el usuario indicó aproximadamente **1 kg de queso por lote de 100 piezas**, además de 2 kg de la masa estándar. El usuario creó **Queso cheddar fuerte** como materia prima activa en kg, con stock y costos en cero.
- Preparación manual en navegador: se creó el producto activo `Masa estándar` (`PRD-MASA-ESTA`, slug `masa-estandar`) sin categoría ni familia. Su unidad base quedó confirmada como kg; su Kardex muestra stock actual cero y ninguna fila de movimientos.
- El producto existente `Tequeños Party Queso Crudos` (`TEQ-PARTY-QUESO-CRU`) conserva su identidad y se confirmó con unidad base pieza. Su Kardex muestra stock cero y ninguna fila de movimientos; el catálogo lo había encontrado sin unidad ni receta antes de completar la unidad base.
- En el recorrido manual se creó y consultó `Receta Masa estándar CRUMAFOOD` (ID `523b7984-68a7-4b70-9691-c13305ab7ff3`), activa, asociada a `Masa estándar`, rendimiento **2 kg**, descripción “Fórmula estándar para un lote de 2 kg”. Sus cinco ingredientes quedaron registrados en la unidad base común kg.
- La edición/captura manual dejó los ingredientes de la receta de masa en kg: Agua **0.53**, Azúcar **0.03**, Sal **0.03**, Margarina **0.18** y Harina de trigo **1.23**; total **2.00 kg**, conforme a la fórmula confirmada.
- El navegador mostró la receta activa `Receta Tequeños Party Queso`, asociada al producto existente `Tequeños Party Queso Crudos`, con rendimiento esperado **100 pza** y los ingredientes **2 kg de Masa estándar + 1 kg de Queso cheddar fuerte**.
- Cada tamaño y relleno es una combinación de producto final con receta propia. Tequeños: tradicional/Party × queso/pizza (pepperoni con queso)/chocolate. Empanadas: tradicional/minis × queso/jamón con queso. La primera combinación validada es Tequeño Party de queso; las demás se cargarán con sus fórmulas cuando se definan.
- Las recetas se podrán ajustar en ingredientes, cantidades y rendimiento; el producto de salida de una receta no se reasigna. El cambio aplica a órdenes nuevas; las órdenes ya creadas conservan su plan capturado en `production_order_items`.
- `recipe_items` solo admite `raw_material_id` y `quantity`. No puede expresar que una receta final consume el producto intermedio masa.
- Cambio mínimo propuesto en BD: agregar a `recipe_items` una referencia nullable `product_id` a `products`; permitir `raw_material_id` nulo y exigir mediante restricción que exactamente una referencia tenga valor. Un índice único parcial limita cada receta a una sola referencia de producto intermedio. La unidad del ingrediente producto es la unidad base de ese producto; la unidad de rendimiento de cada receta debe corresponder a la unidad base de su producto de salida.
- El formulario y la lectura de ingredientes distinguirán materias primas de productos intermedios y mostrarán su unidad. La validación permitirá materias primas con existencia cero, verificará referencias y rechazará que una receta use su propio producto de salida.
- Hasta la historia #4, tanto la acción de crear órdenes como la RPC `create_production_order_draft` rechazarán recetas con ingredientes producto antes de escribir, con un mensaje claro. No se adaptan aún creación de lotes, escalado, reparto, consumo ni rendimiento real.

### Criterios aprobados

- [ ] Dada una variedad intermedia, cuando se guarda su receta, entonces queda asociada a su producto propio, conserva ingredientes en unidades base y declara su rendimiento en la unidad base del producto. Para la masa actual, el rendimiento estándar es **2 kg**.
- [ ] Dada una receta final, cuando se guarda, entonces puede usar una sola variedad específica de masa y materias primas adicionales, y declara el rendimiento esperado en la unidad base del producto final. Para validar la masa actual y Tequeño Party de queso: **2 kg de masa + aproximadamente 1 kg de queso producen 100 piezas**; otras masas y productos pueden configurar sus propios rendimientos.
- [ ] Dado un ingrediente, cuando se guarda, entonces referencia exactamente una materia prima o un producto intermedio válido; se permite una materia prima sin stock, se rechaza que la receta use su propio producto de salida y las recetas solo de materias primas conservan su comportamiento. Mientras #4 no esté disponible, una orden con ingrediente producto se rechaza en servidor/RPC sin crear escrituras y con un mensaje claro.
- [ ] Dada una receta guardada, cuando se editan sus ingredientes, cantidades o rendimiento, entonces se valida y consulta la nueva fórmula; la identidad del producto de salida permanece fija. Las órdenes ya creadas conservan su plan de ingredientes capturado, y las nuevas órdenes usan la fórmula actualizada.

### Pruebas aprobadas

| Caso | Capa |
|---|---|
| Guardar receta de masa con materias primas, unidad de salida kg y rendimiento 2 | Contrato/acción y persistencia de Production |
| Guardar y consultar la receta de la masa actual (2 kg) y la de Tequeños Party (2 kg de esa variedad, rendimiento esperado 100 piezas), con ingredientes, cantidades y unidades | Contrato, validación de referencias, persistencia y lectura de Production |
| Guardar materias primas en una receta aun cuando su stock sea cero | Acción/repositorio y prueba de persistencia SQL |
| Rechazar una segunda variedad de masa en la misma receta y que una receta use su propio producto de salida | Acción/repositorio, índice único y protección SQL |
| Rechazar renglón sin referencia, con referencia indisponible o con materia prima y producto simultáneos; preservar filas existentes | Contrato/acción y restricción SQL |
| Confirmar FK de producto, exclusividad de referencias y compatibilidad de filas históricas solo con `raw_material_id` | SQL de migración sobre reconstrucción limpia y datos existentes |
| Mostrar nombres y unidades correctos; conservar el rendimiento en unidad de salida y empaque fuera de la fórmula | Pruebas de formulario/lectura |
| Editar rendimiento e ingredientes, validar referencias, consultar fórmula actualizada y confirmar que órdenes existentes conservan su plan mientras nuevas órdenes usan la fórmula actual | Contrato/acción, UI y SQL de ciclo de producción |
| Rechazar receta con ingrediente producto antes de escribir desde la acción y desde `create_production_order_draft`, con error claro; confirmar que recetas solo de materias primas siguen creando órdenes | Prueba de acción/repositorio y prueba SQL/RPC con rollback |
| Repetir pruebas actuales de recetas con materias primas y `production_order_lifecycle` | Regresión focal |

### Fuera de alcance y dependencias

- Crear lotes de masa, compartir un mismo lote entre órdenes, escalado desde rendimiento, asignación/consumo por orden, control de sobreconsumo y registro de salidas reales: historia #4, órdenes de producción.
- Reponer inventario a partir de una orden parcial, registrar mermas o modificar stock desde la receta.
- Crear gestión de empaques, empaques de tequeños o equivalencias distintas de las confirmadas arriba.
- Activar recetas nuevas en las órdenes actuales antes de implementar y validar el consumo de ingredientes producto en la historia #4.

Prioridad **P1**. La historia #3 y estos criterios/pruebas están aprobados para implementación.

### Avance de implementación

- La captura y lectura de ingredientes ya contempla materias primas y una variedad intermedia, mostrando sus unidades. El servidor valida referencias activas, permite materias primas con stock cero, limita a una variedad de masa por receta y rechaza el producto de salida como ingrediente.
- La migración `20261109000000_add_intermediate_recipe_ingredients.sql` se aplicó a Supabase de desarrollo `poglpqvmbrfcvtuspvtx`, tras confirmar que el simulacro listaba únicamente esa versión. El historial registra la versión.
- Consulta remota: `recipe_items.product_id` es UUID; `raw_material_id` acepta NULL; el FK, check de exactamente una referencia, dos índices parciales y ambos triggers están presentes y habilitados. Las funciones trigger son `SECURITY INVOKER` y mantienen `search_path` vacío.
- `production_order_lifecycle.sql` se ejecutó manualmente en desarrollo. Persistió y consultó fixtures sintéticos de una receta intermedia (rendimiento 2 kg, materia prima en cantidad 1.25 con stock cero) y una receta final (2 kg de esa masa, rendimiento 100 piezas); confirmó que los renglones almacenados referencian exactamente una materia prima o producto; rechazó referencias ausentes o simultáneas, el producto de salida como ingrediente, una segunda masa y la creación de una orden con ingrediente intermedio, sin dejar escrituras parciales. El archivo terminó con `ROLLBACK`; una consulta posterior confirmó cero fixtures persistidos.
- La primera ejecución de CI en el PR #130 reveló que, en la reconstrucción limpia, insertar en `auth.users` no garantiza el perfil requerido por `production_order_lifecycle_operations.performed_by`. La prueba ahora prepara explícitamente ambos perfiles de fixture, como las demás pruebas SQL de producción. El archivo aún debe repetirse en CI después de este correctivo.
- Tipos regenerados desde el esquema remoto y revisión del diff: solo cambió el contrato de `recipe_items`, las relaciones nuevas del FK a producto y el boilerplate del generador (marcador PostgREST y formato de aliases genéricos). No hubo diferencias en otras tablas, funciones o enums; el archivo generado no se editó manualmente.
- Edición implementada: nombre, descripción, estado y rendimiento son editables; el contrato no recibe ni modifica producto de salida o unidad. Los renglones existentes se pueden actualizar y eliminar, con autorización, validación de referencias y alcance por `recipe_id`.
- La pantalla de la orden ahora lee `production_order_items.planned_quantity`, la cantidad capturada al crearla, en lugar de recalcular desde la receta vigente. El SQL de ciclo incluye una comprobación de que las órdenes existentes conservan el plan y las nuevas usan la receta editada.
- En el worktree aislado desde `origin/main`: 52 pruebas focales de recetas aprobadas, 80 de órdenes de producción y 4 de formularios; typecheck y lint completo aprobados. La primera ejecución de órdenes detectó un cast innecesario; se cambió a la selección tipada de `product_id` y la suite completa pasó al repetirla.
- La inspección del snapshot reveló que RLS estaba activo en `production_order_items` sin política de lectura. Se aplicó `20261110000000_allow_admin_read_production_order_items.sql` en Supabase de desarrollo `poglpqvmbrfcvtuspvtx`; el historial registra la versión. La política concede lectura solo a `authenticated` cuando `public.is_admin(auth.uid())` es verdadero.
- `production_order_lifecycle.sql` pasó completo en desarrollo con la cobertura de snapshot antes/después de editar receta y lectura RLS admin/no-admin. El script terminó con `ROLLBACK`; una consulta de solo lectura confirmó cero productos fixture, cero operaciones de ciclo persistentes y la política instalada.
- El primer intento en navegador para crear una orden con `Receta Tequeños Party Queso` mostró el error genérico (referencia `539991539`). Tras tipar esa condición de negocio y mostrarla en el formulario, se repitió el recorrido: apareció “Las órdenes de producción todavía no admiten productos intermedios como ingredientes.” La consulta de solo lectura a `production_orders` por las notas de ambos intentos (`PRUEBA-BLOQUEO-MASA-20261111` y `PRUEBA-BLOQUEO-MASA-20261111-2`) devolvió cero filas. La primera consulta incluyó por error una columna `status` inexistente y se corrigió retirándola; no modificó datos.
- Verificación local adicional de la corrección del rechazo: 11 pruebas en 2 archivos aprobadas, incluyendo la presentación del mensaje en el formulario; typecheck y ESLint focal aprobados.
- En la primera ejecución CI #4195, Storybook pasó; el build completó typecheck y lint, pero la prueba estática del inventario RLS falló porque esperaba 210 políticas y la nueva política administrativa de lectura de `production_order_items` eleva el total a 211. Se actualizó el inventario a 211 (48 políticas admin-only) y se añadió una aserción específica para la política nueva. La prueba focal del inventario pasa localmente.
- En la ejecución CI #4196, `production_order_lifecycle.sql` y las verificaciones previas de `db:verify` pasaron tras añadir perfiles explícitos a los fixtures. El check real `db:types:check` sí se ejecutó y falló porque el archivo versionado conservaba boilerplate y formato de aliases de una generación anterior.
- Para evitar editar tipos a mano, CI #4197 adjuntó un artefacto diagnóstico con `database.generated.ts` producido por `pnpm db:types:generate`; se recuperó ese archivo completo. El diff contiene solo el metadato PostgREST y el formato de aliases del generador, sin cambios de otras relaciones o contratos de tabla; ahora se versiona el resultado generado, no una edición manual.
- CI #4198 aprobó el commit final: reconstrucción limpia, `db:verify` completo (incluidos SQL/RLS y `db:types:check`), typecheck, lint, pruebas, build y Storybook. El recorrido de navegador del rechazo de la orden con producto intermedio quedó aprobado y se confirmó que no creó órdenes. El recorrido de recetas reales de masa y Tequeño Party de queso también se realizó; los valores del fixture SQL son sintéticos y no representan la fórmula real de CRUMAFOOD.
- Verificación local después de los correctivos: 51 pruebas focales en 5 archivos, typecheck, lint y `git diff --check` aprobados; se incorporó el archivo generado completo desde CI. No se pudo reconstruir Supabase en este entorno porque Docker Desktop no estaba disponible; la reconstrucción y la prueba SQL se validaron en CI #4198.

## Historia #4: órdenes de producción

**Estado:** activa; criterios aprobados para implementación. **Propietario:** Production. Inventory conserva saldos, apartados y movimientos; Quality libera lotes. Depende de REC-03, completada.

### Criterios de aceptación

1. La orden estima ingredientes como cantidad de receta multiplicada por piezas planeadas y dividida por el rendimiento esperado. Ejemplo: 50 piezas Party de una receta de 100 piezas y 2 kg de masa estiman 1 kg. La planificación no aparta stock.
2. Al iniciar, el operador selecciona uno o varios lotes liberados de la misma variedad y pesa lo retirado de cada uno. Inventory aparta esas cantidades de manera atómica; órdenes concurrentes no pueden apartar más de lo disponible.
3. Al cerrar, se registran las piezas reales y el sobrante pesado por lote. Consumo = masa retirada − sobrante. El sobrante permanece fuera del disponible hasta un único destino: incorporarlo a la siguiente preparación de la misma variedad o registrarlo como merma. Todo sobrante debe resolverse al cierre del día, con origen conservado.

### Prueba de aceptación acordada

Planear 50 piezas; retirar 1,050 g de dos lotes; cerrar con 48 piezas reales, 150 g de sobrante pesado y 900 g de consumo calculado por diferencia. Incorporar los 150 g una sola vez a la receta estándar de 2 kg, que mantiene sus cantidades habituales de ingredientes. Registrar por separado el sobrante incorporado y el peso real medido; 2.15 kg es esperado, no un valor impuesto. Verificar que el sobrante solo se cuente una vez en Inventory y que el nuevo lote quede disponible únicamente después de Calidad.

### Plan de implementación y pruebas

1. **Escalado del plan:** prueba SQL de la RPC con rendimiento distinto de 1 (50 de 100 piezas y receta de 2 kg → 1 kg planeado); añadir unitarias focales solo si protegen una regla reutilizada.
2. **Lote y apartado al inicio:** pruebas SQL de lotes liberados de variedad coincidente, selección de varios lotes, cantidades pesadas, disponibilidad concurrente, rechazo atómico e idempotencia.
3. **Cierre por diferencia:** registrar peso retirado, sobrante separado por lote, consumo calculado y piezas reales; verificar que los movimientos y saldos de Inventory concilien.
4. **Destino único del sobrante:** probar espera fuera del saldo disponible, incorporación a nueva preparación (origen trazable, suma única y peso real del lote), descarte como merma, rechazo de segundo destino y resolución al cierre del día.
5. **Compatibilidad y revisión:** mantener recetas solo de materias primas, cuarentena/liberación de Calidad y regresión del ciclo de órdenes; actualizar tipos generados si cambia el esquema.

La prueba automatizada cubre como aceptación los 1,050 g retirados, 900 g consumidos, 150 g sobrantes y 48 piezas reales. Pruebas SQL transaccionales incluyen concurrencia; la reconstrucción limpia y el recorrido de navegador se documentarán por separado.

### Fuera de esta primera entrega

Repartir producto terminado por preparación y condición de almacenamiento, transferir saldos a congelado y limitar envíos foráneos por ruta quedan para una entrega posterior, según el requisito diferido de `pendientes.md`. No se implementan empaques ni se cambian recetas históricas.

### Primer ciclo TDD

Probar primero que la planificación divide las cantidades de ingredientes por el rendimiento de la receta. La prueba debe mostrar que 50 piezas de una receta Party de 100, cuya fórmula usa 2 kg de masa, generan 1 kg planeado; mantener autorización y validación de existencias.

**Avance del ciclo 1:** se añadió la prueba unitaria del cálculo y reprodujo el defecto (`100` en vez de `1`); tras el cambio, las 14 pruebas de `production-order-contract.test.ts` pasan. La validación de stock en servidor ya lee `recipes.yield_quantity` y aplica la misma proporción. Se añadió una regresión SQL que comprueba que `create_production_order_draft` persista 1 kg planeado y una migración nueva que actualiza esa RPC; no se modificó el historial. Typecheck, ESLint focal y `git diff --check` locales pasan. El job database de CI #4203 reconstruyó la base, aplicó `20261111000000_scale_production_order_plan.sql` y ejecutó `production_order_lifecycle.sql` (23 pruebas aprobadas); `db:verify` concluyó exitosamente. El job build detectó que el inventario estático de guardas de autorización pasa de 46 a 47 por esta nueva definición protegida; se actualizó la expectativa a 47. CI #4204 aprobó los jobs build, database y storybook sobre el commit 3650402c; el SQL se volvió a ejecutar en reconstrucción limpia y `db:verify` pasó.
### Segundo ciclo TDD: apartado de masa por lote al iniciar

CI #4205 aprobó el primer ciclo sobre `d3e72b53` (jobs database, build y Storybook); el escalado por rendimiento queda validado.

El snapshot de `production_order_items` ahora contempla el `product_id` de la variedad intermedia. Crear y liberar el borrador no aparta masa; al iniciar, la pantalla permite pesar kg por cada lote liberado de esa variedad. La acción de servidor envía la selección a una RPC de Inventory.

La migración `20261112000000_reserve_intermediate_product_lots_on_start.sql` agrega la referencia exclusiva de ingrediente, el registro por lote de peso apartado y la protección para que una transición directa a `in_progress` no omita la reserva. La RPC bloquea los lotes en orden determinista, verifica variedad, estado/calidad y saldo, descuenta `product_lots.quantity`, registra el peso exacto a cuatro decimales y transiciona la orden en la misma transacción. Esa cantidad no se escribe en `inventory_movements`, cuya columna `quantity` es entera; el registro nuevo conserva los kg y el origen exactos sin redondear gramos.

La prueba SQL del ciclo de vida cubre planificación de 50 piezas con 1 kg estimado, espera sin apartado, rechazo de inicio sin lote, selección de dos lotes (0.60 + 0.45 kg), saldo restante por lote y reintento idempotente. El nuevo script `run-production-order-mass-reservation-concurrency.sh`, conectado a `db:verify`, inicia dos sesiones PostgreSQL contra un lote con 1.5 kg: ambas solicitan 1 kg; una conserva el bloqueo mientras la otra espera. Debe ganar una sola orden y la rechazada debe permanecer liberada, sin reserva ni escritura parcial.

**Validación local del ciclo 2:** 22 pruebas focales aprobadas; typecheck, ESLint focal y `git diff --check` aprobados. El entorno local no tiene Docker daemon, por lo que la base y SQL se validaron en CI.

La primera ejecución del ciclo 2, CI #4206, detectó que el tipo generado debía actualizarse, un error de alias en la agregación SQL y expectativas estáticas antiguas del comando de pruebas. CI #4207 confirmó el error de alias en `production_order_lifecycle.sql` y detectó casts temporales incompatibles con la comprobación de build. Se corrigió el alias, se conectó el RPC a los tipos generados reales recuperados del artefacto de CI, y el flujo móvil FEFO se restringió a ingredientes de materias primas; los productos intermedios se reservan por el ciclo de lotes y no se presentan como materiales FEFO.

**Ciclo 2 validado por CI #4208 sobre `0fdd3935`:** el job `database` reconstruyó Supabase desde cero y aplicó `20261112000000_reserve_intermediate_product_lots_on_start.sql`; `production_order_lifecycle.sql` pasó; `run-production-order-mass-reservation-concurrency.sh` ejecutó dos sesiones PostgreSQL simultáneas contra el mismo lote (una apartó el kg y la otra fue rechazada por saldo insuficiente); `db:types:check` informó `DATABASE_TYPES_CURRENT=OK`. También pasaron `build` (typecheck, lint, pruebas y build) y Storybook. Los tres jobs concluyeron en verde. El PR #132 permanece en borrador; no se ha fusionado.

### Tercer ciclo TDD: cierre con piezas reales y sobrante por lote

La RPC `complete_production_order_with_mass_lot_yield` cierra de forma atómica las reservas de masa, crea una salida pendiente de Calidad con las piezas reales y registra por lote `consumed_quantity = reserved_quantity - surplus_quantity` y `surplus_quantity`. El excedente queda fuera de `product_lots.quantity` y pendiente de destino. El formulario lista cada lote apartado y captura su sobrante pesado; la acción conserva autorización, distingue la receta con producto intermedio y delega el cierre a la RPC tipada. La vía existente para órdenes solo con materias primas permanece igual.

La regresión SQL planea 50 piezas, retira 0.7000 kg y 0.3500 kg de dos lotes, y cierra con 48 piezas, 0.1000 kg y 0.0500 kg de sobrante: verifica consumos de 0.6000 kg y 0.3000 kg, 0.1500 kg pendiente fuera del disponible y una única salida `pending` en Calidad. También intenta cerrar con sobrante mayor que el retiro y comprueba rechazo específico, sin cambios en orden, salida o reservas; luego repite el cierre válido con la misma llave y verifica que no duplica registros.

**Ejecuciones CI del ciclo 3:** CI #4210 sobre `8419fe11` detectó que la aserción de atomicidad esperaba `produced_quantity IS NULL`, aunque la RPC inicializa ese campo en cero; el inventario de seguridad también debía contar la nueva guarda `is_admin`. Se corrigieron ambas expectativas y se recuperó `database.generated.ts` completo del artefacto generado por CI; su diff se limita a las dos columnas de cierre y la nueva RPC. CI #4211 reconstruyó la base y pasó build, pruebas y Storybook, pero la aserción del sobrante excesivo identificó que la RPC comparaba el producto de salida del pedido con el producto intermedio de entrada. CI #4212 registró ese diagnóstico; se corrigió la relación para vincular el ingrediente de `production_order_items` con el producto intermedio de `recipe_items`.

**Ciclo 3 validado por CI #4213 sobre `f4e594ea`:** el job `database` reconstruyó Supabase desde cero, aplicó la migración de cierre, ejecutó y aprobó `production_order_lifecycle.sql` y `db:types:check`. La regresión confirmó el cierre de 50 piezas planeadas con 48 reales; consumos de 0.6000 kg y 0.3000 kg y sobrantes por lote de 0.1000 kg y 0.0500 kg; el rechazo por sobrante superior al peso retirado sin cambios parciales; una única salida pendiente de Calidad después del reintento; y los 0.1500 kg de sobrante fuera del saldo disponible. También pasaron build (typecheck, lint, pruebas y build) y Storybook. No se ha hecho un recorrido de navegador de este cierre. El PR #132 permanece en borrador.

**Verificación local tras las correcciones del ciclo 3:** 75 pruebas enfocadas en 8 archivos, typecheck, ESLint focal y `git diff --check` aprobados. CI #4213 aprobó el SQL y `db:types:check` en reconstrucción limpia; CI #4214 volvió a aprobar el head documental `0ceef90a`. El PR #132 permanece en borrador.

### Cuarto ciclo TDD: destino del sobrante por lote

El sobrante debe permanecer fuera del saldo disponible hasta que el jefe de producción elija un destino. La decisión se registra una sola vez por sobrante: merma, o incorporación a una orden posterior cuya receta produzca la misma variedad. Al completar esa preparación, la salida debe conservar el peso real medido y enlazar el nuevo lote liberado por Calidad con cada lote de origen del sobrante incorporado. La preparación estándar conserva las cantidades de ingredientes de su receta; el sobrante se suma por separado al peso esperado.

El repositorio no tiene un proceso de cierre de turno/día. La primera implementación hará visibles los sobrantes sin resolver y sus destinos en Producción; no inventará un módulo de cierre diario. La operación deberá poder comprobar que el listado de pendientes está vacío al terminar la jornada.

**Ciclo 4 implementado, pendiente de CI:** cada sobrante cerrado puede recibir un único destino. La merma requiere motivo; la reutilización se asigna al iniciar una orden liberada de la misma variedad. La preparación mantiene los ingredientes estándar de su receta, registra el peso real por separado y deja la salida en cuarentena. Al liberar Calidad, el peso real pasa una sola vez al lote disponible y al movimiento de inventario, y las referencias de los sobrantes reutilizados se enlazan al lote nuevo.

La pantalla de inicio de Producción muestra los sobrantes aún sin destino; el detalle de la orden de masa permite iniciar una preparación con sobrantes de esa misma variedad o descartarlos como merma. La pantalla de Calidad identifica el peso real de una salida de masa. No hay un cierre diario en el sistema; verificar que la lista de sobrantes pendientes quede vacía al final de la jornada es el control operativo vigente.

La regresión `production_order_lifecycle.sql` cubre los dos sobrantes del ciclo anterior (100 g y 50 g), su reutilización conjunta en una nueva preparación, rechazo de variedad distinta y de un segundo destino, merma con motivo, idempotencia del cierre y peso medido de 2.15 kg. También verifica que el sobrante quede fuera del disponible hasta Calidad y que al liberar se cree un lote/movimiento de 2.15 kg con trazabilidad hacia ambos orígenes. `finished_product_quality_release.sql` ejercita la RPC real de liberación de Calidad para ese peso. `function_security.sql` ahora comprueba permisos, `SECURITY DEFINER` y `search_path` de las nuevas RPC y funciones de trigger.

**Verificación del ciclo 4:** 16 pruebas unitarias focales, ESLint focal, typecheck y `git diff --check` aprobados localmente tras incorporar el archivo completo de tipos producido por CI. CI #4216 reconstruyó la base desde cero y aplicó la migración; `db:lint`, `function_security.sql`, `production_order_lifecycle.sql` (incluida reutilización, merma y peso medido), `finished_product_quality_release.sql` y las pruebas de consistencia de migraciones pasaron. `db:types:check` identificó que faltaba versionar el esquema generado; se recuperó intacto del artefacto de CI. CI #4217 aprobó typecheck, lint y Storybook, y detectó dos expectativas estáticas desactualizadas; se ajustaron sus conteos RLS y la prueba de escrituras fragmentadas para permitir las lecturas de validación existentes sin admitir escrituras directas. Las nueve pruebas corregidas pasaron localmente. **CI #4218 aprobó el commit `587e2cdd`:** `database` pasó reconstrucción limpia, migración, SQL de seguridad/ciclo/Calidad y `db:types:check`; `build` pasó typecheck, lint, pruebas y build; Storybook también pasó. No hay Docker local. El recorrido manual del ciclo 4 sigue pendiente. El PR #132 permanece en borrador.
