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

**Corrección detectada en el recorrido manual:** el formulario permitió registrar 48 piezas reales de 50 planeadas, con merma 0 y motivo de variación, pero la RPC rechazó el cierre porque la migración anterior exige que producción más merma concilie exactamente con el plan. El usuario confirmó que las dos piezas son diferencia de rendimiento y no merma. La migración sucesora `20261115000000_allow_mass_lot_yield_variance.sql` permite esa diferencia con motivo obligatorio, conserva el rechazo de sobreproducción con merma y no cambia las migraciones históricas. La primera CI #4220 validó la migración y SQL en base limpia, y detectó una expectativa estática desactualizada (53 frente a 54 guardas de función); se corrigió en el commit `393501b4`. **CI #4221 aprobó**: reconstrucción limpia, migración, `production_order_lifecycle.sql` (23 pruebas), tipos generados (`DATABASE_TYPES_CURRENT=OK`), build, pruebas y Storybook. **CI #4222 aprobó también el commit documental `03cfbc53`.** Tras confirmar el proyecto enlazado y que `db push --dry-run` listaba solo esa versión, se aplicó `20261115000000` en Supabase de desarrollo `poglpqvmbrfcvtuspvtx`; `migration list` la muestra aplicada. Verificación remota de solo lectura: la función permite el faltante justificado, exige motivo de variación, conserva `SECURITY DEFINER`, `search_path = ""` y ejecución de `authenticated` únicamente. El intento anterior revirtió completo: la orden seguía en progreso, con dos reservas abiertas, cero salidas y cero piezas. Después de consumir el queso pendiente (0.5 kg), el recorrido manual cerró la orden con 48 piezas, merma 0 y motivo de variación; la consulta remota confirmó consumo de 0.6000 kg y 0.3000 kg por lote, sobrantes de 0.1000 kg y 0.0500 kg pendientes de destino, y una salida de 48 piezas `pending` para Calidad.

La lista `/mobile/production` también falló con la referencia `2893903978` porque su servicio consultaba columnas antiguas de `production_orders`. Se conectó a la consulta tipada vigente y se adaptó el resumen de órdenes activas; la prueba de la lista y la consulta de producción pasaron, y el navegador ya muestra la orden en producción. La tarjeta todavía etiqueta el rendimiento de Masa estándar como “unidades” en vez de kg; no se cambió ese texto durante esta corrección.

### Cuarto ciclo TDD: destino del sobrante por lote

El sobrante debe permanecer fuera del saldo disponible hasta que el jefe de producción elija un destino. La decisión se registra una sola vez por sobrante: merma, o incorporación a una orden posterior cuya receta produzca la misma variedad. Al completar esa preparación, la salida debe conservar el peso real medido y enlazar el nuevo lote liberado por Calidad con cada lote de origen del sobrante incorporado. La preparación estándar conserva las cantidades de ingredientes de su receta; el sobrante se suma por separado al peso esperado.

El repositorio no tiene un proceso de cierre de turno/día. La primera implementación hará visibles los sobrantes sin resolver y sus destinos en Producción; no inventará un módulo de cierre diario. La operación deberá poder comprobar que el listado de pendientes está vacío al terminar la jornada.

**Ciclo 4 implementado, pendiente de CI:** cada sobrante cerrado puede recibir un único destino. La merma requiere motivo; la reutilización se asigna al iniciar una orden liberada de la misma variedad. La preparación mantiene los ingredientes estándar de su receta, registra el peso real por separado y deja la salida en cuarentena. Al liberar Calidad, el peso real pasa una sola vez al lote disponible y al movimiento de inventario, y las referencias de los sobrantes reutilizados se enlazan al lote nuevo.

La pantalla de inicio de Producción muestra los sobrantes aún sin destino; el detalle de la orden de masa permite iniciar una preparación con sobrantes de esa misma variedad o descartarlos como merma. La pantalla de Calidad identifica el peso real de una salida de masa. No hay un cierre diario en el sistema; verificar que la lista de sobrantes pendientes quede vacía al final de la jornada es el control operativo vigente.

La regresión `production_order_lifecycle.sql` cubre los dos sobrantes del ciclo anterior (100 g y 50 g), su reutilización conjunta en una nueva preparación, rechazo de variedad distinta y de un segundo destino, merma con motivo, idempotencia del cierre y peso medido de 2.15 kg. También verifica que el sobrante quede fuera del disponible hasta Calidad y que al liberar se cree un lote/movimiento de 2.15 kg con trazabilidad hacia ambos orígenes. `finished_product_quality_release.sql` ejercita la RPC real de liberación de Calidad para ese peso. `function_security.sql` ahora comprueba permisos, `SECURITY DEFINER` y `search_path` de las nuevas RPC y funciones de trigger.

**Verificación del ciclo 4:** 16 pruebas unitarias focales, ESLint focal, typecheck y `git diff --check` aprobados localmente tras incorporar el archivo completo de tipos producido por CI. CI #4216 reconstruyó la base desde cero y aplicó la migración; `db:lint`, `function_security.sql`, `production_order_lifecycle.sql` (incluida reutilización, merma y peso medido), `finished_product_quality_release.sql` y las pruebas de consistencia de migraciones pasaron. `db:types:check` identificó que faltaba versionar el esquema generado; se recuperó intacto del artefacto de CI. CI #4217 aprobó typecheck, lint y Storybook, y detectó dos expectativas estáticas desactualizadas; se ajustaron sus conteos RLS y la prueba de escrituras fragmentadas para permitir las lecturas de validación existentes sin admitir escrituras directas. Las nueve pruebas corregidas pasaron localmente. **CI #4218 aprobó el commit `587e2cdd`:** `database` pasó reconstrucción limpia, migración, SQL de seguridad/ciclo/Calidad y `db:types:check`; `build` pasó typecheck, lint, pruebas y build. No hay Docker local. El recorrido manual del ciclo 4 está en curso. El PR #132 permanece en borrador.

### Hallazgo separado: etiquetas de lotes de prueba cruzadas

Al preparar el inventario para el recorrido manual de producción, se confirmó que algunas etiquetas de lote quedaron asignadas al ingrediente equivocado: Margarina aparece con `LT-PRUEBA-SAL` y Queso cheddar fuerte con `LT-PRUEBA-MARGARINA`. Es un problema de identificación de los datos de prueba y se mantiene separado de los criterios de la historia #4; no demuestra por sí mismo un defecto del sistema.

### Evidencia manual del ciclo 4 en Supabase de desarrollo

La orden `OP-94F073FB07BB4E089C0AD21CBA3C4BEF` reutilizó los sobrantes de `MP04-MASA-PRUEBA-01` (0.1000 kg) y `MP04-MASA-PRUEBA-02` (0.0500 kg), ambos vinculados a la nueva salida. El peso real medido era 2.1500 kg, pero se capturó por error 2.0000 kg. Antes de Calidad o inventario, se verificó en el proyecto `poglpqvmbrfcvtuspvtx` que la salida seguía `pending`, sin inspección ni lote de inventario. Con autorización expresa, se corrigieron atómicamente `production_outputs.mass_quantity_produced` y `production_mass_output_completion_operations.actual_mass_quantity` a 2.1500 kg. La lectura posterior confirmó ambos valores en 2.1500 kg y dos sobrantes reutilizados por 0.1500 kg. Después la salida se liberó como el lote `MP04-MASA-PRUEBA-03`; la pantalla mostró 2.1500 kg disponibles y saldos de origen de 1.3000 kg y 1.6500 kg.

En la inspección manual de la salida de tequeños, el formulario quedó aprobado, pero el criterio se guardó como texto de instrucción y los valores esperado y observado quedaron vacíos. La interfaz no ofrece edición. Se conserva como hallazgo de calidad de captura; no se creó una inspección duplicada.

La inspección de prueba de la salida de masa `OP-94F073FB07BB4E089C0AD21CBA3C4BEF` quedó aprobada con valores genéricos (`Apto`) para textura y temperatura, sin registrar la medición real en °C. Por decisión del usuario se conserva como dato de prueba, sin corrección; la salida se liberó para completar el recorrido de prueba. Esto no cuenta como validación real de Calidad y deberá repetirse con mediciones reales.

Para liberar una variedad de masa, Calidad verifica textura y temperatura al terminar el amasado. La textura esperada es masa homogénea, lisa y elástica, que pueda laminarse sin romperse, pegarse en exceso ni encogerse demasiado. El rango de aceptación de temperatura confirmado es de 18 °C a 23 °C, inclusive; fuera del rango se marca no conforme y el lote queda retenido. La medición observada se registra en °C. Esta regla aplica por variedad de masa.

La vista `Trazabilidad` de `MP04-MASA-PRUEBA-03` mostró “No hay consumos registrados”, aunque el cierre móvil había completado los cinco ingredientes. La consulta remota de solo lectura confirmó cinco filas en `production_order_consumptions` con sus lotes; RLS estaba habilitado y faltaba una política de lectura para administradores, por lo que el usuario autenticado veía cero filas. Otra consulta confirmó el vínculo del lote nuevo con los orígenes: 0.1000 kg de `MP04-MASA-PRUEBA-01` y 0.0500 kg de `MP04-MASA-PRUEBA-02`. La corrección añade una política SELECT exclusiva para `is_admin(auth.uid())`, muestra esos sobrantes reutilizados en Trazabilidad y hace visibles errores de consulta en vez de presentarlos como listas vacías. La prueba focal de trazabilidad (2), el inventario RLS (5), typecheck, ESLint focal y `git diff --check` pasaron. CI #4223 falló solo porque el inventario estático esperaba 213 políticas; se actualizó a 214 políticas y 51 reglas administrativas. **CI #4224 aprobó `d90f8846`**: reconstrucción limpia y regresión SQL/RLS en database, además de typecheck, lint, pruebas, build y Storybook.

Tras confirmar que el proyecto enlazado era `poglpqvmbrfcvtuspvtx`, `migration list` mostró solo `20261116000000` pendiente y el simulacro listó exclusivamente `20261116000000_allow_admin_read_production_consumptions.sql`. Con autorización expresa se aplicó esa única migración. La verificación remota confirmó la versión registrada y la política `production_order_consumptions_admin_read`; `MP04-MASA-PRUEBA-03` conserva 2.1500 kg y estado `available`. La consulta devolvió cinco consumos vinculados a sus lotes y dos sobrantes reutilizados vinculados a los lotes de origen: 0.1000 kg desde `MP04-MASA-PRUEBA-01` y 0.0500 kg desde `MP04-MASA-PRUEBA-02`. El registro de Margarina sigue apuntando a `LT-PRUEBA-SAL`, correspondiente al hallazgo separado de etiquetas cruzadas. Tras refrescar la pantalla Trazabilidad en localhost, la evidencia visual confirmó el lote disponible con 2.15 de 2.15 kg, los cinco consumos (Agua 0.53, Azúcar 0.03, Sal 0.03, Harina de trigo 1.23 y Margarina 0.18) con sus lotes, y los dos vínculos de sobrante hacia `MP04-MASA-PRUEBA-03` (0.0500 kg desde `MP04-MASA-PRUEBA-02` y 0.1000 kg desde `MP04-MASA-PRUEBA-01`). La pantalla también muestra costos de consumo 4.24, 0.90, 0.60, 36.90 y 10.80 respectivamente; el lote de Margarina sigue asociado al rótulo `LT-PRUEBA-SAL`, conforme al hallazgo separado.

## Historia #4: cierre

El usuario confirmó que el PR #132 quedó fusionado en `main`. CI #4224 validó reconstrucción limpia, migraciones, SQL/RLS, tipos generados, typecheck, lint, pruebas, build y Storybook. El recorrido manual de órdenes de masa y Tequeños Party en desarrollo llegó a Calidad e inventario; la inspección de masa usó valores genéricos de prueba y no acredita los controles reales de temperatura y textura.

## Historia #5: saldos por condición y picking de producto terminado

**Estado:** completada. **Propietario:** Inventory para saldos/movimientos; Warehouse para picking. **Dependencia:** historia #4 completada. Las reglas automáticas por ruta quedan fuera de alcance.

### Criterios aprobados

1. Para productos preparados como crudos, el saldo de cada lote distingue piezas frescas, crudas congeladas y apartadas durante congelación. Iniciar congelación descuenta la cantidad del saldo fresco y de la disponibilidad del producto tras reservas activas; la cantidad apartada no se reserva ni se surte. Los productos no gestionados por condición conservan el picking actual.
2. Cada operación y decisión registra lote de origen, cantidad, destino, motivo, responsable y fecha. La confirmación puede ser parcial. Las piezas solo vuelven a fresco con verificación autorizada de que no llegaron a congelarse y que se conservaron según Calidad; si hay duda, siguen apartadas. Una vez confirmadas como crudas congeladas, no se reclasifican a fresco por ubicación, edición del lote o picking; solo queda decidir el saldo de la misma operación que todavía sigue apartado. Los reintentos con la misma clave devuelven el resultado anterior sin duplicar movimientos.
3. Picking permite seleccionar fresco o crudo congelado, propone el primer lote FEFO de esa condición y descuenta únicamente ese saldo. Si falta cantidad en la condición seleccionada, informa el faltante y el servidor rechaza la operación completa sin escrituras parciales. Las reservas por producto se cuentan una vez y las congelaciones concurrentes comparten el bloqueo de disponibilidad.

### Caso de aceptación acordado

Partir de 48 piezas frescas de Tequeños Party crudos. Apartar 24; tras una interrupción confirmar 10 como crudas congeladas, devolver 8 a fresco mediante verificación autorizada y dejar 6 pendientes. Saldos: 32 frescas, 10 congeladas y 6 apartadas. Surtir 4 congeladas: quedan 32/6/6. Intentar surtir 7 congeladas debe indicar que falta 1 y dejar los tres saldos, reservas, asignaciones y movimientos sin cambio. Tras resolver las 6 pendientes, intentar devolver a fresco una pieza ya confirmada como congelada debe rechazarse sin cambios en saldo o movimientos. Repetir inicio o decisión con la misma clave no duplica operaciones. Con varios lotes, picking debe elegir primero el lote elegible FEFO de la condición indicada.

### Plan de implementación y pruebas

1. Crear las tablas de saldo y auditoría de congelación; iniciar y resolver operaciones con idempotencia, bloqueo por producto/lote y movimientos atómicos. No se backfillan datos históricos. Mientras el producto no tenga saldo explícito por condición, picking conserva el flujo actual. En `/lots/storage-conditions`, un operador puede iniciar congelación de un lote crudo disponible; esa primera operación crea el saldo explícito desde la cantidad disponible y activa picking por condición para el producto. Los lotes activos restantes sin fila explícita se contabilizan como frescos para conservar su saldo anterior.
2. Integrar picking móvil: leer saldo por condición, permitir selección y cantidad entera, mostrar la sugerencia FEFO y el faltante; confirmar en servidor dentro de una transacción. Conservar la RPC anterior como adaptador del flujo heredado.
3. Extender SQL/RLS de liberación de lote para el ciclo 32/10/6, reintentos, devolución autorizada, rechazo atómico por faltante y FEFO entre lotes. Añadir un runner de dos sesiones para congelación contra reserva y para dos inicios de congelación en el mismo producto.
4. Verificar la lista operativa de saldos y las decisiones pendientes, tipos generados, typecheck, lint y pruebas focales. Documentar por separado resultados locales automatizados, SQL, concurrencia y navegador.

### Avance de implementación

Se añadieron `20261117000000_track_finished_product_storage_conditions.sql` y `20261118000000_pick_finished_products_by_storage_condition.sql`. La primera define saldos por lote, operaciones y decisiones auditadas, consultas administrativas y RPC idempotentes para apartar/resolver cantidades; serializa congelación con la reserva comercial mediante el bloqueo de la fila de producto. La segunda conserva la condición en asignaciones de picking y aplica FEFO y validación de faltantes dentro de una RPC. La pantalla `/lots/storage-conditions` permite iniciar congelación y registrar decisiones parciales; el picking móvil ofrece fresco/crudo congelado solo cuando el producto está gestionado por condición y mantiene el flujo anterior para los demás.

La regresión SQL `finished_product_quality_release.sql` contiene el caso 48 → 32/10/6, reintento, surtido de 4 congeladas, rechazo de 7 sin cambios, resolución final de las 6 y selección FEFO entre dos lotes. Después de resolverlas, también intenta devolver una pieza confirmada como congelada a fresco y comprueba el rechazo, los saldos finales y que no se agreguen decisiones ni movimientos. Las escrituras directas autenticadas sobre `product_lots` y los saldos están revocadas; ubicación, edición de lote y picking no tienen una ruta que reclasifique saldo congelado.

El runner `run-finished-product-storage-concurrency.sh` está conectado al final de `db:test:security` para cubrir en dos sesiones la carrera entre reserva y congelación y entre dos operadores, conservando el orden verificado por las pruebas existentes. Typecheck, ESLint focal y las 27 pruebas unitarias enfocadas pasaron; tras el ajuste del runner, las cinco pruebas de integración estática que fallaron en CI #4229 también pasan (42 tests). CI #4228 reconstruyó la base desde cero, pero no llegó a ejecutar las pruebas: PostgreSQL rechazó la definición de picking porque una lista `INTO` mezclaba un registro compuesto y un escalar; se corrigió separando la lectura del lote bloqueado y su saldo. CI #4229 aplicó todas las migraciones en una base limpia, pero la regresión encontró que su fixture FEFO insertaba `product_lots` bajo `authenticated`, rol de solo lectura. El fixture ahora se prepara antes del cambio de rol. CI generó el archivo completo de tipos; se incorporó ese resultado, que añade las tablas/vistas/RPC de congelación y la columna de condición. `db:types:check` aún debe pasar en la siguiente ejecución CI. Las regresiones SQL, concurrencia y verificación final de tipos quedan pendientes de esa ejecución. Docker Desktop no está disponible localmente. No se aplicaron migraciones remotas.

### Actualización final de verificación — 2026-11-17

Esta sección sustituye los estados pendientes de CI y la nota de migraciones remotas del avance anterior. El runner `run-finished-product-storage-concurrency.sh` verifica en dos sesiones la carrera entre reserva y congelación, además de dos inicios de congelación sobre el mismo saldo. CI #4235 pasó para `86c472b5`: reconstruyó la base desde cero, ejecutó la regresión SQL de condiciones, el runner concurrente, las pruebas de tipos generados y `db:types:check`; también pasaron build, typecheck, lint, tests y Storybook.

### Recorrido manual en navegador — desarrollo

Se comprobó que `.env.local` y el proyecto Supabase enlazado apuntan a desarrollo `poglpqvmbrfcvtuspvtx`. El simulacro enumeró únicamente `20261117000000` y `20261118000000`, en ese orden; ambas migraciones se aplicaron y `supabase migration list` confirmó las dos versiones registradas.

El lote de producto terminado `MP05-TEQ-PARTY-48-20261117`, Tequeños Party Queso Crudos, se liberó con 48 piezas y trazabilidad a la orden de armado `OP-B31B0983E2264A54A0492C4AF7973D27`. En `/lots/storage-conditions`, los saldos observados fueron: inicial 48/0/0; tras iniciar congelación de 24, 24/0/24; después de confirmar 10 crudas congeladas y devolver 8 a fresco con motivo de verificación autorizada de Calidad, 32/10/6 (fresco/crudo congelado/en congelación).

Se creó el pedido de prueba `SO-20261117-64D540` por 11 piezas y se confirmó el picking. La interfaz mostró 32 frescas, 10 congeladas y 6 apartadas. Tras surtir 4 crudas congeladas, mostró 4 de 11 surtidas y saldos 32/6/6. Al solicitar las 7 restantes, mostró `Faltan 1 piezas en la condición seleccionada`; el picking y los saldos siguieron en 4 de 11 y 32/6/6. La interfaz bloqueó la confirmación por falta de saldo; el rechazo atómico del servidor se comprueba por separado en la regresión SQL de CI.

La consulta de solo lectura en Supabase de desarrollo verificó la asignación guardada: pedido `SO-20261117-64D540`, 4 piezas surtidas desde `MP05-TEQ-PARTY-48-20261117`, `storage_condition = raw_frozen`, y orden de armado `OP-B31B0983E2264A54A0492C4AF7973D27`. La cámara no estuvo disponible; se capturó manualmente el lote sugerido. El saldo de 6 piezas en congelación permanece pendiente de decisión al cierre del recorrido.

### Cierre — PR #133

El PR #133 quedó fusionado en `main` como `52fdc9b0`; la rama local `main` se sincronizó con `origin/main` en ese commit. CI #4236 pasó para el commit documental `a8e3e438`; los jobs `database`, `build` y `storybook` concluyeron correctamente. La evidencia de navegador y la consulta de solo lectura están registradas arriba. El recorrido observó 32 piezas frescas, 6 crudas congeladas y 6 apartadas; el pedido `SO-20261117-64D540` surtió 4 crudas congeladas del lote `MP05-TEQ-PARTY-48-20261117`, enlazado a `OP-B31B0983E2264A54A0492C4AF7973D27`. La solicitud de 7 piezas mostró faltante de 1 y no cambió el saldo ni la asignación. Las 6 piezas apartadas permanecen pendientes de disposición.

## Historia #6: muestreo y retención de producto crudo congelado

**Estado:** primer ciclo de apartado automático y consulta de cantidades de muestra validado en CI; quedan pendientes los ciclos de inspección, disposición y seguimiento de retención. **Propietario:** Quality para inspección y disposición; Inventory conserva saldos, custodia y movimientos; Production es la fuente de la orden y la salida. La salida mantiene la relación con la orden; al crearse el lote de inventario, las muestras quedan vinculadas a ese lote y a la porción que representan.

### Alcance aprobado

Aplicar primero a tequeños y empanadas crudos congelados. Al confirmar saldo congelado, apartar una sola vez por lote/producto/relleno/preparación 2 piezas para inspección inmediata y 3 piezas para retención, antes de habilitar cualquier excedente para reservas o picking. Nueva inspección muestra ambas cantidades en solo lectura y con unidad. La orden conserva la producción bruta.

Se mantienen los destinos acordados: retorno de muestra intacta al mismo lote con autorización de Calidad; merma directa de Calidad para muestra consumida; custodia para muestra intacta conservada como testigo; disposición pendiente si hay duda. Cada movimiento conserva cantidad, origen, destino, fecha y responsable. La custodia se consulta al cierre diario. El indicador mensual compara las muestras intactas en custodia de lotes producidos ese mes con la producción bruta de la misma preparación y condición; para crudo congelado, el denominador incluye las piezas confirmadas en esa condición antes del apartado. La merma directa se presenta aparte y se compara con la meta de 0.1 %–0.5 %.

### Umbral aprobado

Acumular confirmaciones parciales del mismo lote, producto, relleno y preparación. Mientras haya menos de cinco piezas crudas congeladas confirmadas, se mantienen apartadas y fuera de reservas y picking. Al llegar a cinco, apartar 2 para inspección inmediata y 3 para retención en una sola operación; solo el excedente queda disponible. Si un lote termina con menos de cinco, permanece apartado para disposición de Calidad. No se combinan cantidades entre lotes.

### Prueba inicial propuesta

En `finished_product_quality_release.sql`, partir de 48 piezas de un producto crudo; congelar solo una parte, confirmar cantidades en varias operaciones y reintentar una confirmación. Verificar que, al completar el umbral acordado, se aparten exactamente 2 piezas inmediatas y 3 de retención una sola vez, que solo el excedente confirmado se sume al saldo crudo congelado disponible, que el saldo fresco no cambie fuera de la cantidad congelada, que ATP/picking excluyan las muestras y que la orden conserve las 48 piezas brutas. Añadir el caso de 3 confirmadas (0 disponibles) y luego 4 más (5 apartadas una vez, 2 disponibles), el reintento idempotente de la segunda confirmación, exactamente 5 (0 disponibles), y dos lotes independientes de 4 y 1 que permanecen apartados sin combinarse.

El ciclo SQL cubre el flujo existente de 48 piezas (confirmación parcial, devolución autorizada a fresco, picking, rechazo por saldo y reintentos) y agrega los casos aprobados de muestreo: 3 confirmadas no disponibles; 4 posteriores cruzan el umbral, apartan 2+3 una vez y dejan 2; reintentar no duplica decisiones ni movimientos; exactamente 5 deja 0 disponibles; lotes separados de 4 y 1 permanecen apartados sin combinarse. La migración `20261119000000_reserve_frozen_quality_samples.sql` agrega saldos de umbral y muestras, y ajusta la confirmación para que el excedente sea el único que entra al inventario disponible. La pantalla de condición muestra los saldos pendientes y apartados.

La regresión `db:test:finished-product-release` y el runner de concurrencia forman parte de `db:verify` ejecutado por el job `database` de CI. El commit `36ad5d11` pasó CI #4243: reconstrucción limpia, aplicación de migraciones, regresiones SQL, concurrencia, verificación de tipos generados, typecheck, lint, pruebas, build y Storybook. El caso concurrente conserva 8 frescas, 25 crudas congeladas disponibles, 10 en congelación y 5 reservadas (2 inmediatas y 3 de retención); el lote queda con 33 piezas en el saldo general. `Nueva inspección` presenta por lote las cantidades de inspección inmediata y retención con unidad en modo de solo lectura; la prueba del resumen pasó y `tsc --noEmit` pasó localmente. La prueba específica del inventario de autoridad RLS pasó localmente (7/7). El SQL local no se pudo ejecutar porque Docker Desktop no tenía un daemon activo; su verificación queda cubierta por CI sobre base reconstruida desde cero. El recorrido manual del apartado y la exclusi.n de picking se registr. abajo; los ciclos de inspecci.n, disposici.n y seguimiento de retenci.n siguen pendientes. El PR #134 permanece en borrador y la historia #6 continúa abierta.

**Recorrido manual de apartado en desarrollo:** después de aplicar la migración autorizada `20261119000000_reserve_frozen_quality_samples.sql`, la pantalla `Nueva inspección` mostró 2 piezas para inspección inmediata y 3 para retención en el lote `MP05-TEQ-PARTY-48-20261117`. La condición de almacenamiento mostró 27 frescas, 6 crudas congeladas disponibles y 6 en congelación; las 5 piezas de muestra no se sumaron al saldo disponible. Picking mostró 6 congeladas disponibles y, al solicitar 7, indicó un faltante de 1 e inhabilitó el botón de confirmación. No hubo escritura de picking en ese intento. La muestra sigue apartada; los ciclos de registro de inspección, disposición y seguimiento de retención siguen pendientes.

### Siguiente ciclo: registrar inspección inmediata

La cantidad de 2 piezas procede de `product_lot_quality_samples`; el formulario no acepta una cantidad editada por el operador. El servidor registra la inspección usando el flujo y los criterios existentes de Calidad, enlaza la inspección con la muestra, el lote de inventario, la orden y su salida, y transiciona la muestra a pendiente de disposición. La transacción no devuelve ni consume inventario: esas piezas permanecen apartadas hasta un ciclo explícito de disposición. Una muestra inmediata admite una sola inspección.

Pruebas: inspeccionar las 2 piezas con criterios y defectos; consultar el vínculo muestra/lote/orden/salida y el resultado; verificar que el saldo no cambie y la muestra quede pendiente de disposición; rechazar un segundo registro sin duplicar inspección, ítems ni defectos; comprobar autorización administrativa. La UI mostrará el resumen existente y un acceso de inspección con cantidad/unidad de solo lectura. Retorno, merma, custodia y disposición pendiente se implementan en el ciclo posterior.

**Avance del ciclo:** la migración `20261120000000_record_frozen_product_quality_sample_inspection.sql` se aplicó al proyecto de desarrollo `poglpqvmbrfcvtuspvtx`; `migration list` confirma que local y remoto coinciden hasta esa versión. Los tipos completos se regeneraron desde `--linked --schema public`; el diff solo añade la referencia de muestra, su RPC, `PostgrestVersion` y el formato de alias emitido por el generador. Typecheck pasó, al igual que 13 pruebas unitarias focales, ESLint focal y `git diff --check`. La ejecución de `finished_product_quality_release.sql` mediante `db query --linked` no llegó a la regresión: el fixture encontró que el UUID fijo de perfil `f1000000-0000-4000-8000-000000000001` ya existe en la base de desarrollo con datos; el archivo está envuelto en `BEGIN`/`ROLLBACK`. La regresión SQL debe pasar en reconstrucción limpia de CI. Docker local no está disponible. `next-env.d.ts` permanece intacto.

El primer envío manual falló por referencias ambiguas `inspection_id` y `rejected_quantity`; ambas llamadas fueron rechazadas transaccionalmente. En el proyecto de desarrollo enlazado `poglpqvmbrfcvtuspvtx`, se aplicaron con autorización `20261121000000_fix_quality_sample_inspection_id_ambiguity.sql` y `20261122000000_avoid_quality_sample_inspection_variable_conflicts.sql`. El simulacro confirmado por el usuario y el simulacro inmediatamente anterior a la segunda aplicación listaron únicamente `20261122000000`; `migration list` confirma local y remoto hasta esa versión. La segunda corrección prefija todas las variables locales con `v_`.

**Recorrido manual de inspección inmediata:** en el lote `MP05-TEQ-PARTY-48-20261117`, de la orden `OP-B31B0983E2264A54A0492C4AF7973D27`, se guardó la inspección de 2 piezas. La pantalla mostró estado Aprobada, 2 aceptadas, 0 rechazadas, criterio “consistencia esperada y observada” con esperado “Cerrado, sin roturas” y observado “Tamaño y forma deseada.”, sin defectos. La inspección quedó vinculada al lote y a la orden/salida; la interfaz confirmó que las piezas siguen apartadas para disposición. La regresión SQL permanece pendiente de CI en una base limpia; el intento manual en desarrollo chocó con el UUID fijo de perfil ya existente en los fixtures.

CI #4245 para `0f0a6be3` reconstruyó la base y encontró que la RPC buscaba la salida liberada solo por orden y producto. La regresión prepara varias salidas del mismo producto y orden; la inspección debe vincularse a `product_lots.production_output_id`. También falló el inventario estático porque `functionGuards` cuenta cada definición guardada en migraciones históricas; el total esperado pasó de 63 a 67 con las cuatro definiciones de la RPC. Se preparó `20261123000000_link_quality_sample_to_exact_production_output.sql` para resolver el vínculo exacto, y se actualizó el conteo esperado del inventario.

CI #4246 para `6e5b7ccc` pasó build, Storybook y las regresiones del job `database`, incluidas la reconstrucción limpia y las pruebas SQL, pero falló la comprobación final de tipos generados. El diff del artefacto de CI mostró únicamente diferencias de salida del generador (sin cambios de esquema): se eliminó `__InternalSupabase.PostgrestVersion` y cambió el formato de los tipos auxiliares. Se incorporó `database.generated.ts` directamente desde el artefacto de CI, sin edición manual. CI #4247 para `3b727cb8` pasó los tres jobs: reconstrucción limpia, aplicación de migraciones, regresiones SQL, runner de concurrencia, tipos generados, build y Storybook. La inspección manual de dos piezas también quedó verificada; las piezas continúan apartadas para disposición. El PR #134 sigue en borrador y la historia #6 permanece abierta para los ciclos de destino/disposición y seguimiento de retención.

Las reglas de cocidos congelados, masa, discos #14 y productos con levadura se documentan en `pendientes.md` como pendientes de habilitación; sus cantidades no se extrapolan ni se usan como valores por defecto.

### Ciclo siguiente: disposición de la muestra inmediata de producto congelado

La aprobación de la inspección y el destino de sus piezas son operaciones separadas. La disposición se registra por cantidad y permite combinar destinos en una misma muestra: devolución al lote solo con autorización explícita de Calidad y verificación de que las piezas siguen intactas y conservaron higiene y conservación; o merma directa de Calidad para muestras consumidas o destruidas. Las piezas sin decisión y las tres de retención permanecen apartadas. La devolución reincorpora las piezas al saldo crudo congelado y al lote; la merma reduce el apartado de Calidad sin generar una segunda salida de inventario, porque esas piezas nunca estuvieron en el saldo liberable. Cada decisión registra lote/muestra, cantidad, destino, motivo, responsable y fecha. Una clave de idempotencia evita movimientos duplicados; las escrituras de la disposición y el saldo se realizan en una sola RPC transaccional.

La regresión SQL añadida cubre el caso bruto de 48 piezas con 2 de inspección inmediata y 3 en custodia: devolver las 2 deja 45 liberables; consumirlas en prueba destructiva deja 43 liberables y 2 de merma directa; en ambos casos permanecen 48 piezas brutas y 3 en custodia. También cubre destinos distintos por pieza, retorno no autorizado sin cambios, reintentos, saldo/movimientos únicos, autorización y lectura administrativa. Quedan para el siguiente ciclo el seguimiento diario y mensual de retención.

Verificación local de este ciclo: 22 pruebas unitarias focales pasaron en 3 archivos; ESLint focal, typecheck y `git diff --check` pasaron. La prueba SQL local no se pudo ejecutar porque Docker Desktop no tenía un daemon disponible; CI la ejecutó sobre una reconstrucción limpia. El archivo `database.generated.ts` se tomó del artefacto de CI, sin edición manual. El recorrido manual de disposición se completó en el proyecto de desarrollo `poglpqvmbrfcvtuspvtx`, después de aplicar con autorización `20261123000000` y `20261124000000`; `migration list` confirmó ambas versiones registradas y sin migraciones pendientes.

**CI #4249, commit `8a5bf5fc`:** el job `database` reconstruyó la base limpia, aplicó la migración, pasó `db lint` y ejecutó correctamente `finished_product_quality_release.sql`. La regresión confirmó ambos resultados acordados: al devolver las 2 piezas inmediatas con autorización quedan 45 liberables, 3 en custodia y 48 brutas; al consumirlas en prueba destructiva quedan 43 liberables, 2 de merma directa de Calidad, 3 en custodia y 48 brutas. También pasó el caso de destinos distintos por pieza, rechazo sin autorización, vínculo a la inspección exacta y reintentos sin duplicación. `storybook` pasó. `build` y la verificación final de `database` fallaron porque faltaba reflejar en `database.generated.ts` la tabla de disposiciones y la RPC añadidas por la migración. El archivo exacto del artefacto `database-generated-types-44187780779-1` se comparó con el esquema: el diff agrega solo esa tabla y esa RPC, con columnas, relaciones y argumentos correspondientes. Se incorporó sin edición manual en el commit separado `4cdd9e1f`.

**CI #4250**, para el último commit `4cdd9e1f`, pasó los tres jobs: `database` reconstruyó desde cero, aplicó las migraciones, pasó `db lint`, regresiones SQL y verificación de tipos; `build` pasó typecheck, lint, pruebas y build; `storybook` pasó sus pruebas, build y baselines. El ciclo de disposición quedó validado en CI. El PR #134 permanece en borrador; el seguimiento diario y mensual de retención queda para el ciclo siguiente.

**Recorrido manual de disposición en desarrollo:** en la inspección aprobada de 2 piezas del lote `MP05-TEQ-PARTY-48-20261117` y orden `OP-B31B0983E2264A54A0492C4AF7973D27`, se devolvió 1 pieza intacta con autorización de Calidad y se registró 1 como merma directa tras prueba destructiva. La inspección permaneció aprobada; la página mostró 0 piezas pendientes y ambos destinos con responsable y fecha. El primer intento de merma se rechazó porque el formulario envió también la autorización de retorno; la validación ocurrió antes de guardar y el reintento no duplicó la devolución. En `lots/storage-conditions`, el saldo quedó en 27 frescas, 7 crudas congeladas, 6 en congelación, 0 bajo umbral pendiente y 3 muestras apartadas para Calidad. La recarga forzada de la página mostró los dos indicadores que no aparecían con el servidor anterior. Permanecen visibles dos operaciones de congelación pendientes de pruebas anteriores (1 de 24 y 5 de 5); no se modificaron. El seguimiento diario y mensual de retención queda para el siguiente ciclo. El PR #134 continúa en borrador.

CI #4251 para el commit documental `01373a9c` pasó los tres jobs `database`, `build` y `storybook`, confirmando el último commit publicado.

**CI #4255, último commit `7a59760c`:** los tres jobs `database`, `build` y `storybook` pasaron. `database` reconstruyó la base desde cero, aplicó todas las migraciones, pasó `db lint`, ejecutó `finished_product_quality_release.sql` y confirmó los tipos generados. La regresión verificó el cierre diario repetido sin filas duplicadas; para octubre, 3 muestras en custodia de lotes producidos ese mes sobre 48 piezas de producción bruta (6.25%), 2 de merma directa separadas, exclusión de la muestra del lote producido en septiembre y estado pendiente cuando falta el cierre del último día. `build` pasó typecheck, lint, pruebas y build; `storybook` pasó sus pruebas y baselines.

En desarrollo, `.env.local` apunta a `poglpqvmbrfcvtuspvtx.supabase.co` y `supabase/.temp/project-ref` coincide con `poglpqvmbrfcvtuspvtx`. El simulacro listó únicamente `20261125000000_add_quality_retention_closes_and_monthly_indicator.sql`; se aplicó con autorización y `migration list` confirmó la versión registrada, sin otras migraciones pendientes.

El recorrido manual de `/qa/retention` queda pendiente: la habilidad de Computer Use no logró conectar su canal nativo tras reiniciar y repetir la selección de aplicaciones. No se cerró el día ni se hicieron escrituras desde la interfaz. El comportamiento de cierre idempotente, indicador pendiente, merma separada y filtro por mes de producción queda validado por la regresión SQL de CI; falta verificar visualmente esas salidas y el cierre repetido en la aplicación de desarrollo antes de pasar el PR #134 a listo para revisión.

### Ciclo de cierre diario y retención mensual (en curso)

El módulo propietario sigue siendo Quality. La migración `20261125000000_add_quality_retention_closes_and_monthly_indicator.sql` agrega un cierre diario idempotente por fecha: en una sola transacción registra las muestras de seguridad intactas que estén en custodia. El operador cierra la fecha actual; no se permite reconstruir cierres históricos a partir del estado de hoy. El historial conserva la cantidad y fecha de cada fotografía; repetir la misma fecha devuelve el cierre previo sin volver a insertar partidas. Solo administradores pueden cerrar o consultar.

La ruta `/qa/retention`, enlazada desde Control de Calidad, permite cerrar un día y consultar cierres recientes y el indicador mensual por producto y preparación. Las consultas y escrituras quedan en el repositorio de aplicación de Quality. El mes solo se considera cerrado cuando existe la fotografía del último día calendario. El numerador usa las muestras de seguridad intactas capturadas en esa fotografía, vinculadas a lotes cuyas órdenes se completaron en ese mes. El denominador es la producción bruta real de esos mismos producto y preparación, sumada desde `production_outputs.quantity_produced`; no depende de cuántas piezas se congelaron. Así, una muestra presente en varios cierres diarios aparece una sola vez: el cálculo usa exclusivamente el cierre del último día del mes. La merma directa de Calidad se muestra por separado por fecha de disposición; no se suma a la custodia. Si falta el cierre mensual, la retención se muestra pendiente, sin presentar un cero engañoso. La pantalla señala si el porcentaje queda fuera de la meta de 0.1%–0.5%.

La regresión SQL en `finished_product_quality_release.sql` prepara un producto/preparación aislado con 48 piezas de producción bruta, 40 confirmadas crudas congeladas, 3 intactas en custodia y 2 de merma directa. Inserta dos fotografías diarias consecutivas de octubre para comprobar que el reporte usa solo la del último día; además llama dos veces el cierre real de la fecha actual y comprueba que devuelve el mismo identificador y no duplica filas. El indicador mensual debe dar 3/48 = 6.25%, con 2 piezas de merma separadas. También comprueba que una muestra de un lote producido en otro mes no se suma, y que sin fotografía del último día el indicador aparece Pendiente aun con producción bruta y merma reportable. Comprueba además el acceso administrativo. La regresión de disposición existente ya cubre merma al primer intento e idempotencia sin duplicar movimientos; una prueba de interfaz cambia desde devolución autorizada a merma, confirma que el primer envío omite `return_authorized` y pasa la validación del servidor.

**Verificaciones locales:** las 14 pruebas unitarias focales, ESLint focal y typecheck pasaron; `git diff --check` pasó. La prueba SQL no pudo ejecutarse: Git Bash encontró que Docker Desktop no tiene activo el daemon local (`dockerDesktopLinuxEngine` ausente). La regeneración de `database.generated.ts`, la reconstrucción limpia, `db lint` y la ejecución de SQL siguen pendientes de CI; no se editaron tipos manualmente ni se aplicó la migración a Supabase remoto. El PR #134 permanece en borrador. `next-env.d.ts` y las dos operaciones manuales anteriores de congelación se dejan fuera de este cambio y sin modificación.

**Recorrido manual de retención en desarrollo — 2026-11-18:** en `/qa/retention`, cerrar el día 2026-11-18 registró 1 muestra de seguridad con 3 piezas. Se repitió la misma acción con la fecha sin cambiar; la interfaz mantuvo una sola fila, el mismo registro y las 3 piezas, confirmando idempotencia. Al consultar noviembre de 2026, ambas filas mostraron `Pendiente de cierre` y `Falta el cierre del último día`: Masa estándar con producción bruta 3 unidades y 0 de merma directa; Tequeños Party Queso Crudos · Crudo con 48 piezas de producción bruta y 1 pieza de merma directa. La merma se muestra separada del saldo de custodia. No se cerró una fecha futura ni se alteraron cierres históricos. La exclusión de muestras de lotes producidos en otro mes quedó verificada por la regresión SQL de CI #4255.

Este recorrido completó la comprobación visual que estaba pendiente en la nota previa. Tras pasar CI #4257, el PR #134 quedó listo para revisión.

### Cierre del ciclo diario y retención mensual

El recorrido manual y CI #4257 completan este ciclo de la historia #6. CI #4257 pasó para `54542a0f`: `database` reconstruyó la base limpia, aplicó migraciones y pasó `db lint`, regresión SQL y tipos generados; `build` y `storybook` también pasaron. La pantalla `/qa/retention` confirmó cierre diario idempotente (18/11/2026: 1 muestra, 3 piezas) y el indicador de noviembre pendiente hasta el cierre del último día. Mostró la merma por separado: 1 pieza para Tequeños Party Queso Crudos · Crudo y 0 para Masa estándar. La regresión SQL confirmó además que una muestra de lote producido en otro mes no contamina el indicador. La migración de retención está aplicada y registrada únicamente en el proyecto de desarrollo `poglpqvmbrfcvtuspvtx`.

**Estado de la historia #6:** completada. El PR #134 se fusionó en `main` como `c248e1de` después de pasar CI #4258; la historia se marcó completada en `backlog.md`. Los ciclos aprobados de apartado, inspección inmediata, disposición, cierre diario y consulta mensual están implementados y verificados.

## Historia #7: preparación de queso y existencias consumibles

**Estado:** historia activa en `backlog.md`; primer ciclo implementado y validado con CI y recorrido manual en desarrollo. El PR #135 sigue en borrador, pendiente de revisión. **Módulos propietarios:** Production registra las operaciones de preparación y sus rendimientos; Inventory conserva los saldos, lotes y movimientos.

### Reglas acordadas y alcance del primer ciclo

Palitos de queso Party, palitos tradicionales y queso rallado son existencias consumibles distintas, cada una vinculada con los lotes de origen. En los palitos se registra el conteo obtenido y el peso total real; el queso de entrada, el recorte y el rallado se miden en kg. El primer ciclo permite elegir el tamaño de palito (Party o tradicional) y rallar el recorte; el caso de aceptación usa Party. El corte registra su merma separada del recorte aprovechable; el rallado consume el recorte y registra por separado el rallado obtenido y su merma.

### Criterios propuestos para el primer ciclo

- **Dado** un lote con 0.907 kg de queso y el tamaño Party seleccionado, **cuando** el operador registra el corte, **entonces** se descuentan 0.907 kg del lote de origen y quedan 65 palitos con peso conjunto real de 0.650 kg, 0.245 kg de recorte aprovechable y 0.012 kg de merma de corte. Palitos y recorte son existencias distintas, vinculadas al lote de queso.
- **Dado** el recorte de 0.245 kg del corte anterior, **cuando** el operador lo ralla, **entonces** el recorte queda en cero y se registran 0.237 kg de queso rallado y 0.008 kg de merma de rallado. El rallado queda disponible como existencia separada y conserva la trazabilidad hasta el lote de queso original.
- **Dado** un registro cuyo peso de salida, recorte y merma no concilia con la entrada, o un reintento/sobreconsumo, **cuando** se guarda la operación, **entonces** la diferencia queda visible sin asignarse automáticamente a merma, el reintento no duplica saldos ni movimientos y el exceso se rechaza sin escrituras parciales.

### Pruebas propuestas para el primer ciclo

- Corte con el caso de 907 g: 650 g en 65 palitos Party, 245 g de recorte, 12 g de merma. Verificar total de 907 g, dos existencias de salida y vínculo al lote de origen.
- Rallado de los 245 g de recorte: 237 g rallados y 8 g de merma. Verificar saldo de recorte en cero, mermas de corte/rallado separadas y trazabilidad queso de origen → recorte → rallado.
- Diferencia no explicada: con 902 g entre salidas, recorte y merma de corte, mostrar 5 g para revisión.
- Reintento idempotente y exceso sobre saldo: no duplicar ni dejar movimientos parciales.

### Plan propuesto

- Registrar una operación de corte sobre un lote de queso y separar palitos del tamaño elegido, recorte aprovechable y merma medida.
- Registrar el rallado como otra operación que consume recorte y produce queso rallado y merma separados.
- Mantener cantidades y vínculos de origen consistentes en una sola escritura de inventario por operación.
- Mostrar el detalle de salidas y diferencias para revisión del jefe de producción.
- Verificar entradas, salidas, merma, trazabilidad, idempotencia y rechazo por saldo en pruebas automatizadas y SQL sobre una reconstrucción limpia.

Fuera del primer ciclo: consumo desde recetas y órdenes de producción; jamón, chocolate, pizza y rellenos de empanada; congelación del rallado.

### Ciclo posterior propuesto: consumo por receta y orden

La receta debe referenciar el tipo exacto de existencia consumible; la orden debe escalarlo y consumir solo de lotes elegibles de ese tipo, con trazabilidad hasta la operación de preparación y el queso de origen. Pruebas propuestas: una receta Party no puede surtirse con palitos tradicionales ni rallado; una receta tradicional no puede usar palitos Party; una receta de empanada puede consumir queso rallado en kg; el plan y la orden respetan la unidad del ingrediente; se rechaza el saldo insuficiente sin escritura parcial y dos órdenes concurrentes no consumen más que el saldo. Probar también FEFO entre lotes de la misma existencia preparada.

### Brechas y decisión pendiente para el ciclo de consumo

`recipe_items` ya identifica una materia prima concreta o un producto intermedio y guarda una cantidad numérica; la orden escala y consume esa referencia usando sus lotes. El esquema actual no representa la operación que transforma un lote de queso en tres existencias distintas ni conserva el enlace de origen entre esas salidas. Además, el inventario y consumo de materia prima usan una sola unidad base por existencia, mientras que el palito tiene conteo y peso real.

**Unidad acordada para el ciclo posterior:** las recetas/órdenes consumirán palitos Party y tradicionales por pieza, y queso rallado en kg. La receta Party debe seleccionar palito Party; una orden de 50 Party requiere 50 palitos Party aunque haya palitos tradicionales disponibles. Al habilitar ese ciclo, actualizar explícitamente las recetas activas a la unidad y presentación correctas; conservar sin cambios las cantidades y unidades guardadas en órdenes históricas. Las pruebas cubrirán la selección exacta, el faltante Party sin tocar otros saldos, el FEFO por presentación y la preservación histórica.

**Costeo acordado para el primer ciclo:** cada salida recibe el costo por kg del lote consumido multiplicado por su peso real; el costo de la merma se registra por separado en cada operación. El costo por palito es el costo total de su peso real dividido entre las piezas obtenidas; el recorte conserva el costo de su peso hasta el rallado. La regresión monetaria usa costo de origen de $20.0000/kg: los 0.907 kg valen $18.1400, distribuidos entre 0.650 kg de palitos ($13.0000; $0.2000 por palito), 0.237 kg de rallado ($4.7400), merma de corte 0.012 kg ($0.2400) y merma de rallado 0.008 kg ($0.1600). El costo y saldo del recorte de 0.245 kg ($4.9000) quedan en cero al convertirse. El total final concilia exactamente en $18.1400.

**Implementación del primer ciclo:** Production registra corte y rallado como operaciones atómicas; `raw_material_lots` y `raw_materials.current_stock` continúan como fuentes de verdad para los saldos. Cada operación crea lote(s) de salida con el costo unitario según el peso medido y registra movimientos enlazados al registro de preparación. La tabla de operaciones conserva costos de entrada, salidas, merma y cualquier peso/costo sin explicar, para conciliar y rastrear el recorte hasta el rallado. Las llamadas tienen clave idempotente y bloquean el lote y las materias primas afectadas para evitar doble consumo y actualizaciones perdidas.

La pantalla `/cheese-preparation` se enlaza desde Producción. Para operar deben existir en Materias Primas las existencias de palitos Party (pza), palitos tradicionales (pza), recorte de queso para rallar (kg) y queso rallado (kg); el formulario filtra por unidad y por nombre de la preparación, y el servidor vuelve a validar las unidades. No se sembrarán materiales ni inventario automáticamente. El uso de esas existencias en recetas/órdenes sigue fuera de este ciclo.

La regresión SQL `cheese_preparation_cost_reconciliation.sql` comprueba corte Party desde 0.907 kg a $20/kg, costo de $13.0000 para 65 palitos, $4.9000 al recorte y $0.2400 de merma de corte; luego consume el recorte y comprueba $4.7400 para 0.237 kg rallados y $0.1600 de merma de rallado. La conciliación final es $18.1400, con saldo y valor de inventario del recorte en cero. Repite ambos RPC con las mismas claves y confirma que no se duplican operaciones, costos ni movimientos. CI #4263 reconstruyó una base limpia, aplicó `20261126000000_prepare_cheese_sticks_and_grate_trim.sql`, pasó la regresión SQL y `db:types:check` (`DATABASE_TYPES_CURRENT=OK`); `build` y `storybook` también pasaron para `d37681472ad28e0c015b22f1a317d700583a54a2`. `database.generated.ts` contiene el archivo exacto generado por CI. [Ejecución CI #4263](https://github.com/crumafood-create/CRUMA-Platform/actions/runs/44345683553).

**Recorrido manual en Supabase de desarrollo — 2026-11-18:** proyecto `poglpqvmbrfcvtuspvtx`; se aplicó y registró la migración `20261126000000_prepare_cheese_sticks_and_grate_trim.sql`. Se crearon las existencias preparadas con unidades base Party/tradicional en piezas y recorte/rallado en kg. Orden de prueba `PO-20261118-47B8BB`: compra directa de 0.907 kg de queso cheddar fuerte a $130/kg, total $117.91 sin flete. El lote `MP07-MANUAL-QSO-20261118-A` se recibió en cuarentena y se liberó tras una inspección aprobada de 0.1 kg. La inspección registró integridad del empaque; el valor esperado quedó capturado como `Empaque íntegro y cerrad` (error tipográfico aceptado por el usuario para esta prueba), observado `Empaque cerrado`.

El corte Party consumió los 0.907 kg ($117.91) y produjo 65 palitos de 0.650 kg y $84.50 (`CHEESE-CUT-73d64f595fbe42c8ba1e8dd89882b87c`), 0.245 kg de recorte con $31.85 (`CHEESE-TRIM-73d64f595fbe42c8ba1e8dd89882b87c`) y 0.012 kg de merma con $1.56. El rallado consumió el recorte completo y produjo 0.237 kg de queso rallado con $30.81 (`CHEESE-GRATED-afce1ac796234228bb205d9b731bee83`) y 0.008 kg de merma con $1.04. Los costos conciliaron en $117.91. La consulta de Materias Primas mostró: queso de origen 0 kg; palitos Party 65 pzas a $1.30/pza; recorte 0 kg (valor de inventario $0; conserva $130/kg como costo unitario histórico); queso rallado 0.237 kg a $130/kg. La trazabilidad queso de origen → recorte → rallado quedó visible en el historial de preparación.

**Siguiente ciclo de la historia #7:** integrar estas existencias exactas en recetas y órdenes de producción, con consumo en piezas para palitos Party/tradicionales y en kg para queso rallado, selección de lotes por FEFO dentro del tipo de existencia, rechazo por faltante sin tocar otras presentaciones y preservación de las cantidades/unidades de órdenes históricas. El PR #135 permanece en borrador; el ciclo de consumo queda pendiente.

**Regla de valoración del lote de palitos:** el esquema existente guardaba solo `quantity` y `unit_cost`; el snapshot de consumos calculaba `total_cost` como cantidad × costo unitario redondeado, por lo que no podía conservar el residual de $0.0001. La corrección añade `raw_material_lots.remaining_value`; los lotes existentes se inicializan desde su cantidad y costo unitario registrados, y las nuevas salidas de preparación reciben el costo total exacto de la operación. El costo unitario sigue siendo un valor de presentación redondeado. Un consumo parcial asigna el valor proporcional redondeado a cuatro decimales y el último retiro recibe todo el valor remanente, dejando cantidad y valor en cero. La integración de las recetas activas con las existencias Party/tradicionales/rallado, incluida su selección FEFO y el historial de cantidades/unidades, sigue pendiente del ciclo posterior. La nueva regresión usa un lote de 65 piezas y $83.8694, consume 50 y luego 15, y comprueba $64.5149 + $19.3545, el agotamiento exacto y reintentos idempotentes. La validación CI de la migración quedó completada; su aplicación al proyecto remoto de desarrollo sigue pendiente de autorización separada.

La migración sucesora `20261128000000_validate_cheese_preparation_materials_and_expiry.sql` también liga recorte y queso rallado a sus códigos autorizados, rechaza lotes de origen vencidos en corte y rallado, inicializa el valor de los lotes existentes desde cantidad × costo unitario y comprueba esa actualización antes de continuar. Las regresiones de preparación verifican rechazo sin escrituras parciales y que las salidas tengan el mismo valor persistido que las operaciones. `production_material_consumption.sql` cubre la asignación de $64.5149 a 50 piezas y $19.3545 a las 15 restantes de un lote valorado en $83.8694, agotamiento en cantidad/valor cero y reintentos idempotentes. `purchase_order_presentations.sql`, `raw_material_quality_release.sql` y `raw_material_lot_adjustment.sql` verifican que recepción, liberación de Calidad y ajustes inicialicen o mantengan el valor junto con la cantidad. La migración no se ha aplicado al proyecto remoto.

**CI de valoración exacta — 2026-11-18:** CI #4271 pasó sobre `ed8e2e75b9c88e0631a28c7088cb5a4bda7133b3`. El job `database` reconstruyó la base desde cero, aplicó las migraciones, pasó `db lint`, las regresiones SQL y `db:types:check`. La regresión de consumo confirmó para 65 palitos con valor total $83.8694 las salidas de 50 por $64.5149 y 15 por $19.3545; reintentar cada operación no duplicó consumos, costos ni movimientos, y el lote terminó con cantidad y valor cero. Las regresiones también verificaron el backfill de lotes existentes a `round(quantity * unit_cost, 4)`, inicialización por recepción, conservación al liberar Calidad y actualización por ajustes. En corte/rallado se comprobaron valores de lote iguales a los costos de operación y agotamiento del recorte en saldo y valor cero. `database.generated.ts` fue incorporado sin edición manual desde el artefacto de CI #4269, y CI #4271 confirmó que los tipos generados coinciden. Los jobs `build` (typecheck, lint, pruebas y build) y `storybook` también pasaron. [Ejecución CI #4271](https://github.com/crumafood-create/CRUMA-Platform/actions/runs/44395419507). El PR #135 permanece en borrador y no se aplicó la nueva migración a Supabase remoto.

**Verificación local — 2026-11-18:** pasaron las 7 pruebas unitarias focales, ESLint de los archivos del recorrido, `tsc --noEmit` y `git diff --check`. Docker no tenía activo el daemon local; la reconstrucción y regresión SQL se validaron en CI #4263. `database.generated.ts` se recuperó del artefacto exacto generado por CI y el último commit pasó su verificación de tipos.

**Correcciones de invariantes de preparación — 2026-11-18:** en el proyecto Supabase de desarrollo `poglpqvmbrfcvtuspvtx` se confirmó el destino enlazado y el simulacro enumeró únicamente `20261127000000_correct_cheese_preparation_invariants.sql`. Se aplicó esa migración y `migration list` confirmó la versión en remoto. La regresión `cheese_preparation_cost_reconciliation.sql` se ejecutó con `db query --linked`; el script corre en una transacción y termina con `ROLLBACK`.

La regresión verificó que el costo de entrada de 0.907 kg a $129.03/kg (`$117.0302`) concilia con las salidas redondeadas a cuatro decimales: palitos Party `$83.8694`, recorte `$31.6124` y merma de corte `$1.5484`, sin diferencia negativa ni costo sin explicar. También rechazó ambos cruces de presentación (Party acreditado a tradicionales y tradicional acreditado a Party) y comprobó que fallaran sin cambiar existencias, operaciones o movimientos. Aceptó los pesos representables en pasos de 0.0001 kg. Después del rollback, una consulta de solo lectura confirmó que las existencias de desarrollo seguían en Party 65 pzas, tradicionales 0 pzas, recorte 0 kg y rallado 0.237 kg.

La regresión se ajustó para ejecutarse de forma repetible sobre el catálogo y el historial ya existentes en desarrollo: renombra materiales canónicos solo dentro de la transacción y compara conteos de movimientos contra la línea base, sin modificar datos persistentes. CI #4266 pasó para `97452b6bc759fbaad19585e59c461b1c4084db10`: `database` reconstruyó la base limpia, aplicó las migraciones hasta `20261127000000`, pasó `db lint`, la regresión SQL y la verificación de tipos; `build` y `storybook` también pasaron. [Ejecución CI #4266](https://github.com/crumafood-create/CRUMA-Platform/actions/runs/44371844484). El PR #135 sigue en borrador.

**Recorrido manual de correcciones en la interfaz — 2026-11-18:** se creó la orden `PO-20261118-BF22F0` por 0.907 kg de queso cheddar a $129.03/kg (importe $117.0302) y se recibió como lote `MP07-REV-REDONDEO-20261118-A`. Calidad aprobó una muestra de 0.05 kg y liberó el lote. La página Materias Primas mostró después 0.907 kg a $129.03/kg.

Se intentó registrar un corte Party seleccionando la existencia de palitos tradicionales. El servidor rechazó la operación con `Cheese preparation materials are unavailable or not distinct.`; el historial no añadió operación y Materias Primas mantuvo los saldos previos: queso 0.907 kg, Party 65 pzas, tradicionales 0, recorte 0 kg.

Con la existencia Party correcta, el corte consumió el lote completo y mostró costo de entrada $117.0302, 65 palitos/0.6500 kg con costo $83.8694, recorte de 0.2450 kg con costo $31.6124 y merma de corte de 0.0120 kg con costo $1.5484. El rallado posterior consumió esos 0.2450 kg y produjo 0.2370 kg de queso rallado por $30.5802 y 0.0080 kg de merma por $1.0322. La conciliación final fue exacta: $83.8694 + $30.5802 + $1.5484 + $1.0322 = $117.0302. Los lotes de salida fueron `CHEESE-CUT-3f5bb2e9587d4c67b7dfbae71547b6ca`, `CHEESE-TRIM-3f5bb2e9587d4c67b7dfbae71547b6ca` y `CHEESE-GRATED-ae971126b37741359d1535287a30a0c5`.

**Identidad autorizada de queso de origen — pendiente de validación:** la migración sucesora `20261129000000_validate_cheese_cut_source_material.sql` valida en la escritura de `cheese_preparation_operations` que toda operación `cut` use la materia prima cuyo `internal_code` es `MP-QSO-CHED-FUER`; no depende del nombre visible. La regresión usa un nombre de presentación distinto para ese código, prueba que el lote del queso autorizado sigue cortándose, y rechaza un lote disponible en kg de otra materia prima. En el rechazo verifica que saldos, operaciones, lotes y movimientos permanecen intactos. CI y la aplicación/verificación en desarrollo quedan pendientes.

**Identidad autorizada y valoración de queso — verificación completada:** la migración `20261129000000_validate_cheese_cut_source_material.sql` valida en cada operación `cut` que la materia prima tenga `internal_code = MP-QSO-CHED-FUER`, sin depender del nombre visible. La regresión aceptó el lote autorizado con una etiqueta distinta y rechazó un lote disponible en kg de otra materia prima sin alterar saldo, operación, lote ni movimiento.

En desarrollo `poglpqvmbrfcvtuspvtx`, el simulacro enumeró exactamente `20261128000000_validate_cheese_preparation_materials_and_expiry.sql` y `20261129000000_validate_cheese_cut_source_material.sql`, en ese orden. Ambas quedaron aplicadas y registradas en `migration list`. Las regresiones `cheese_preparation_cost_reconciliation.sql` y `production_material_consumption.sql` pasaron con datos aislados y `ROLLBACK`. El lote de 65 palitos se consumió en dos salidas por `$64.5149` (50 piezas) y `$19.3545` (15 piezas); los reintentos no duplicaron costos y terminó con cantidad y valor cero.

CI #4275 pasó para `f69443ae15bfe42027b3ee4ba7a4ddf6869770e3`: reconstrucción limpia, `db lint`, regresiones SQL, tipos generados, build, pruebas y Storybook. El generador no produjo diferencias en `database.generated.ts`. El fixture de consumo actualiza el perfil si Supabase ya lo creó al insertar `auth.users`. [Ejecución CI #4275](https://github.com/crumafood-create/CRUMA-Platform/actions/runs/44401628034). El PR #135 continúa en borrador.

**Cierre del primer ciclo de la historia #7 — 2026-11-18:** PR #135 fue fusionado en `main`; el merge commit local y remoto es `918b337dcd0eca2f47745fc97ef7b87c7fd2a911`. CI #4276 pasó antes de la fusión. El recorrido de desarrollo verificó corte y rallado, trazabilidad de lotes, mermas separadas, rechazo de una materia prima de origen no autorizada, asignación del residual monetario y consumo completo de un lote de palitos sin dejar cantidad ni valor. El costo de entrada de 0.907 kg a $129.03/kg ($117.0302) quedó conciliado entre palitos Party ($83.8694), queso rallado ($30.5802), merma de corte ($1.5484) y merma de rallado ($1.0322). La historia #7 permanece abierta para el ciclo de integración de estas presentaciones con recetas y órdenes.

**Historia #7, ciclo de consumo — refinamiento aprobado y regresión en preparación:** la receta activa de 100 Tequeños Party de queso registra 100 palitos Party en piezas; la orden de 50 planea 50 piezas de esa presentación. La prueba crea un snapshot histórico en kg, cambia explícitamente el ingrediente de la receta activa y confirma que el snapshot anterior conserva su referencia, cantidad y unidad. Para una orden nueva, verifica dos retiros FEFO Party de 30 y 20 piezas, cada uno con clave de idempotencia propia; los costos de los lotes se concilian con los consumos y movimientos vinculados. Reintentar devuelve los resultados previos sin duplicar escrituras. Un segundo escaneo fallido deja el primer retiro confirmado y 20 piezas pendientes; el saldo tradicional permanece intacto. Un caso separado comprueba que, sin stock Party y con stock tradicional, no se sustituye la presentación ni se escriben consumos parciales. La regresión está añadida a `supabase/tests/database/production_material_consumption.sql`, que ya se ejecuta en `db:test:production-consumption` y `db:verify`.

**Ejecución de SQL pendiente:** `pnpm.cmd run db:test:production-consumption` no pudo iniciar el runner en este Windows porque `bash` no está en PATH. Al invocar el runner con Git Bash, este confirmó que no hay daemon Docker disponible (`docker_engine` no existe); por eso la regresión SQL aún no se ha ejecutado. No se usó Supabase remoto. El flujo de aplicación ya se verificó manualmente; la regresión SQL requiere CI sobre una reconstrucción limpia antes de cerrar la historia.

**Recorrido manual del consumo desde receta y orden — 2026-11-19:** se actualizó la receta activa «Tequeños Party Queso» a 100 palitos Party por 100 piezas y se creó la orden `OP-31C49AC0A6DB42178B9C2CB61BDE1EA3` por 50 piezas. Se apartó 1 kg de masa (0.6000 kg del lote `MP04-MASA-PRUEBA-01` y 0.4000 kg del lote `MP04-MASA-PRUEBA-02`). La acción móvil confirmó 50/50 palitos Party; el saldo del material pasó de 130 a 80 piezas. La orden quedó completada con 50 piezas. La primera consulta de «Ver Consumos» no mostraba filas porque leía la tabla heredada `production_lot_consumptions`; la página se corrigió localmente para leer `production_order_consumptions`. Al recargar, mostró el lote FEFO `CHEESE-CUT-73d64f595fbe42c8ba1e8dd89882b87c`, 50 piezas a $1.3000 c/u y $65.0000 total, con caducidad 2026-12-17. El typecheck y `git diff --check` pasaron. El recorrido confirma consumo de la presentación Party y su costo; el reparto 30+20 entre dos lotes sigue cubierto por la regresión automatizada. La anomalía de navegación al primer envío y la descripción de receta desactualizada quedaron anotadas en `pendientes.md`; no se hizo commit.

**Corrección local durante el cierre del ciclo de consumo — 2026-11-19:** el recorrido confirmó que la primera navegación posterior a «Liberar Orden» fue inesperada. `releaseProductionOrder` ya revalidaba la ruta, pero no dirigía explícitamente al detalle; se agregó la redirección al detalle de la misma orden para que el resultado de la transición sea visible sin reintentarla. Esta corrección aún requiere repetir ese paso en navegador sobre una orden de prueba. La descripción desactualizada no determinó el material consumido: la orden y la pantalla móvil mostraron `MP-PAL-QUESO-PARTY` y el consumo registrado coincide con esa presentación; el texto sigue pendiente de actualización por ser confuso.

**Pruebas locales del ciclo de consumo — 2026-11-19:** `pnpm.cmd typecheck` pasó; `pnpm.cmd production:test:consumption` pasó con 27 pruebas y `pnpm.cmd production:test:orders` con 89 pruebas. Estas pruebas no sustituyen la regresión SQL en CI sobre la base limpia.

**CI inicial del ciclo de consumo — 2026-11-19:** CI #4278 reconstruyó la base limpia; `build` y `storybook` pasaron. `database` llegó a `production_material_consumption.sql` y falló en la comprobación histórica porque el test asumía un valor planeado fijo (0.5000 kg) en vez de comparar el snapshot efectivamente guardado antes y después de editar la receta. Los retiros 30+20 y el escenario final sin stock Party todavía no se ejecutaron debido a ese fallo anterior. La regresión se corrigió para capturar referencia, cantidad y unidad previas y compararlas tras revisar la receta; la nueva ejecución de CI queda pendiente.

**Revisión de la regresión histórica — CI #4279:** la base limpia y `build`/`storybook` pasaron, pero `production_material_consumption.sql` se detuvo antes de ejecutar los casos de consumo porque una aserción adicional suponía que el snapshot de la orden tenía una referencia y unidad concretas que el fixture no establece. Se eliminó esa suposición: la prueba exige que exista el snapshot y compara, antes y después de revisar la receta, la referencia, la cantidad y la unidad base que realmente guarda la orden. Los escenarios 30+20 y sin stock Party quedan pendientes de una nueva ejecución de CI.

**Revisión de la regresión histórica — CI #4280:** la comprobación del snapshot pasó en la base limpia. El SQL luego falló porque una aserción consultó una tabla temporal con el rol `authenticated`; se añadió `RESET ROLE` solo alrededor de esa lectura y se restaura `authenticated` para ejecutar las transiciones y consumos. La regresión de lotes Party y el chequeo de tipos generados requieren una nueva ejecución de CI.

**CI de regresión del ciclo de consumo — 2026-11-19:** CI #4281 pasó para `5ea5d6e48eba948cc985d340302305b61163fbce` sobre la base reconstruida desde cero. `production_material_consumption.sql` completó los escenarios de 30 piezas del primer lote y 20 del segundo por FEFO; valoración y saldos por lote; reintentos con las mismas claves; rechazo del segundo retiro sin revertir las 30 primeras y dejando 20 pendientes; y rechazo cuando solo hay palitos tradicionales, sin cambiar inventario. También pasó la revisión de receta activa con comparación del snapshot guardado antes/después. `DATABASE_TYPES_CURRENT=OK`; build, typecheck, lint, pruebas y Storybook pasaron. No se generó un diff de tipos. [Ejecución CI #4281](https://github.com/crumafood-create/CRUMA-Platform/actions/runs/44574547214).

El recorrido manual confirmó que la orden `OP-31C49AC0A6DB42178B9C2CB61BDE1EA3` usó 50 palitos Party, con el lote FEFO y los costos esperados. La referencia de receta desactualizada no alteró la presentación identificada en el consumo. La redirección explícita tras liberar se repitió en navegador con la nueva orden `OP-B9FAC00F49FE4D6FBA2432911E909FC3`: tras un solo clic en «Liberar Orden», permaneció en el detalle de esa misma orden, en estado `Liberada`, y mostró los lotes de masa disponibles para iniciar. No se inició ni consumió esta orden de prueba.

**Cierre de historia #7:** PR #136 se fusionó en `main` como `3d1fc6c1`; CI #4283 aprobó las cuatro regresiones SQL, la comprobación de tipos y los demás jobs según la confirmación del usuario. El recorrido manual confirmó la planificación y el consumo de 50 palitos Party por lote FEFO, la consulta del lote/costo y la navegación tras liberar. La historia queda completada. La descripción desactualizada de la receta permanece en `pendientes.md` como hallazgo separado.

## Preparación de ingredientes y rellenos — ciclo inicial de jamón rallado

### Alcance refinado

Production registra el rallado del jamón y sus pesos reales; Inventory mantiene el lote de origen, el lote resultante, los saldos, movimientos y valores. Antes de crear datos, se consultó el proyecto de desarrollo Supabase `poglpqvmbrfcvtuspvtx` por códigos y nombres equivalentes a Jamón y Jamón rallado; la consulta devolvió cero filas. No se crearon registros ni se aplicó una migración remota en esa revisión.

Los identificadores de catálogo acordados son `MP-JAMON` y `MP-JAM-RALLADO`, ambos con unidad base kg. El rallado debe seleccionar esos materiales por código interno; no depende de los nombres visibles. El lote de jamón rallado se registra con cantidad, valor asignado, lote de origen, ubicación de congelación y estado `freezing`. Mientras está en ese estado no aumenta `raw_materials.current_stock` ni aparece en consultas de lotes disponibles. Al confirmar que terminó la congelación, una transacción cambia el lote a `available`, incorpora una sola vez el saldo y el costo promedio y crea el movimiento de entrada con responsable y fecha. `created_at` de la operación registra el inicio del proceso y el movimiento de confirmación registra su término. No se prescriben temperatura ni duración porque no se han definido para este proceso.

### Criterios actualizados

- **Dado** un lote disponible de `MP-JAMON` en kg, el material `MP-JAM-RALLADO` en kg y una ubicación activa, **cuando** Producción registra el peso de entrada, el peso aprovechable y la merma medida, **entonces** Inventory consume una sola vez el lote de origen, conserva el vínculo y crea un lote de salida aún no disponible en estado `freezing`.
- **Dado** un lote de salida en congelación, **cuando** un operador autorizado confirma que la congelación terminó, **entonces** el lote pasa a disponible, el saldo y el costo promedio aumentan una sola vez y el movimiento registra actor y fecha; durante la espera queda excluido de reservas, recetas y picking por el filtro de estado `available`.
- **Dado** el costo restante del lote fuente, **cuando** el rallado se registra, **entonces** el valor retirado se concilia entre jamón rallado aprovechable, merma medida y cualquier diferencia sin explicar; el residual de redondeo se asigna al producto aprovechable, y el mismo costo queda en la operación y en el valor restante del lote de salida. Un reintento no duplica operaciones, lotes, movimientos ni valor.

### Prueba SQL inicial propuesta

En una transacción con datos aislados y `ROLLBACK`, crear 0.5000 kg de Jamón a $80/kg y procesar 0.5000 kg de entrada, 0.4800 kg aprovechables y 0.0200 kg de merma. Verificar costo fuente de $40.0000, lote de Jamón rallado con valor de $38.4000, merma de $1.6000 y diferencia no explicada cero. Repetir con la misma clave y comparar estado, cantidades, valor y movimientos. Antes de confirmar congelación, el lote debe estar en `freezing`, stock agregado cero y solo existir el movimiento de salida del jamón. Tras confirmar dos veces, debe haber exactamente un movimiento de entrada, un lote `available`, 0.4800 kg de stock y costo promedio de $80/kg.

### Alcance posterior: mezcla para orden

Jamón rallado y queso rallado se mantienen como existencias separadas. Para preparar el relleno 50/50 se retirarán de sus lotes FEFO las cantidades medidas una sola vez, se vinculará la mezcla a la orden y cada componente conservará su origen y costo. El costo retirado se dividirá entre el relleno incorporado al producto y la merma de la orden según el peso real de cada componente presente en cada destino. Los 20 g de mezcla descongelada serán merma de la orden, quedarán fuera de inventario y no volverán a generar un consumo ni un costo al registrarse como merma. El ejemplo previo de 250 g de cada componente para 50 minis y 20 g de sobrante no determina por sí solo cuánto se retiró originalmente; se solicitó aclarar si deben retirarse 260 g de cada componente para obtener 500 g de relleno para producto y 20 g de mezcla como merma. Esta pregunta no bloquea el ciclo de rallado de jamón.

### Estado de validación

La consulta remota confirmó inicialmente que los dos materiales no existían en el proyecto de desarrollo. Se añadió una regresión SQL transaccional y un script `db:test:ham-grating` conectado a `db:test:security`. El 2026-11-19 se confirmó el proyecto `poglpqvmbrfcvtuspvtx`; el simulacro listó únicamente `20261130000000_grate_ham_and_track_freezing.sql`, se aplicó y el historial remoto la registra. `db push --dry-run` informa que el proyecto está al día. La aplicación local apunta al mismo proyecto. El administrador creó Jamón (`MP-JAMON`) y Jamón rallado (`MP-JAM-RALLADO`), ambos en kg. La orden `PO-20261119-37F29F` recibió 0.5000 kg de Jamón a $80/kg en el lote `MP08-MANUAL-JAMON-20261119-A`; Calidad aprobó una muestra de 0.0500 kg y liberó el lote. El rallado manual creó `HAM-GRATED-4f117bfa87734a66a7326fdd61a47852` con 0.4800 kg y valor de $38.4000; los 0.0200 kg de merma costaron $1.6000, conciliando los $40.0000 del origen. Al confirmar la congelación, el lote pasó a disponible y Materias Primas mostró 0.480 kg de Jamón rallado con costo promedio de $80/kg. La pantalla se reorganizó y la ruta pasó a `/ingredient-preparation`; `/cheese-preparation` redirige a la nueva ruta. Typecheck, 13 pruebas focalizadas y `git diff --check` pasaron después del cambio de interfaz. Se intentó ejecutar el runner SQL, pero Docker no pudo abrir `npipe:////./pipe/docker_engine`; por eso no corrieron las aserciones SQL ni se regeneraron los tipos contra el esquema nuevo. Ambos pasos quedan pendientes. No se ha creado commit ni publicado una rama.

### Regla aprobada para almacenamiento de preparaciones — 2026-11-19

Esta decisión reemplaza el paso anterior de congelar Jamón rallado. Aplica a **toda preparación de ingredientes**: palitos Party y tradicionales, recortes, queso rallado, jamón rallado y preparaciones que se agreguen al flujo. Ninguna de estas salidas va a congelación. Calidad decide para cada lote si corresponde almacén seco o refrigerado y establece su caducidad interna. El producto terminado conserva su flujo independiente de fresco/crudo congelado/cocido congelado.

Production mantiene la operación, pesos, mermas, costo y vínculo a los lotes de entrada. Inventory conserva la cantidad y el `remaining_value` de cada lote de salida en estado `quarantine`, fuera de `raw_materials.current_stock` y de las consultas disponibles. La salida no crea una entrada de inventario antes de Calidad. Calidad puede consultar el origen directo y, para el recorte rallado, el lote original de queso. Solo una inspección aprobada permite registrar tipo de almacén seco/refrigerado, ubicación activa y caducidad interna futura; la liberación cambia una vez el lote a `available`, suma su cantidad y valor al saldo y crea un movimiento de entrada. La restricción en base exige una decisión de liberación aprobada y esos metadatos, evitando que una actualización directa salte el flujo.

La migración `20261201000000_quality_release_of_prepared_ingredients.sql` añade la condición de almacenamiento, la inspección y liberación de lotes preparados y la transición de saldos preparados heredados. Los lotes preparados antes de la migración se apartan en cuarentena: los que estaban disponibles generan un movimiento de salida por el remanente, se excluyen de stock disponible y recalculan el costo promedio desde los valores de los lotes aún disponibles; los que estaban en el paso anterior de congelación pasan a cuarentena sin entrada ni salida adicional. La ubicación y caducidad heredadas se limpian para que Calidad registre la decisión correcta. Los registros de operación, lotes, valores y consumos históricos se conservan.

Las regresiones incluyen:

- Un lote comprado mantiene su inspección y liberación actuales.
- Una salida preparada se inspecciona con el lote de origen visible, no suma stock antes de Calidad y, tras liberar, queda disponible con la misma cantidad y valor, condición, ubicación y caducidad.
- Un lote sin operación de preparación no puede usar la liberación de preparaciones.
- Un reintento idéntico devuelve la decisión previa sin duplicar inventario ni movimientos; una selección diferente después de liberar se rechaza.
- Las preparaciones de queso para palitos, recorte y rallado siguen la misma cuarentena, inspección y liberación.

**Verificación local:** typecheck aprobado y 15 pruebas unitarias focalizadas aprobadas. `git diff --check` pasó; solo reportó los avisos de conversión LF/CRLF. La regresión SQL y `db lint` no se pudieron ejecutar localmente porque Docker no está instalado/activo.

**Aplicación en desarrollo:** se confirmó el proyecto `poglpqvmbrfcvtuspvtx`. Tras corregir la restricción para conservar inspecciones históricas de muestras de producto, el simulacro enumeró únicamente `20261201000000_quality_release_of_prepared_ingredients.sql`; se aplicó con éxito el 2026-11-19. `supabase migration list` registra la versión en local y remoto, y `db push --dry-run` confirma que no quedan migraciones pendientes. Las consultas de solo lectura verificaron la transición de cinco lotes preparados: 65 palitos Party, 15 palitos Party remanentes, dos lotes de queso rallado de 0.237 kg y 0.480 kg de jamón rallado quedaron en `quarantine`, sin condición, ubicación ni caducidad asignadas. Se crearon cinco movimientos de salida por las cantidades que estaban disponibles; el inventario agregado de esas materias preparadas quedó en cero y los valores de lote y trazas se conservaron. El lote de recorte ya agotado permaneció en cero; los lotes con `freezing` pasaron a cuarentena sin otro movimiento. No se hizo liberación de Calidad en navegador tras la migración.

La consulta también mostró un hallazgo histórico de valoración: un lote Party de 65 piezas conserva `remaining_value = $83.8695`, mientras su operación de corte registra `output_cost = $83.8694`. La migración de transición preservó ambos datos y no intentó corregirlos. Debe revisarse antes de liberar ese lote, porque la transición no debe ocultar ni redistribuir el residual monetario.

Los tipos se regeneraron desde el esquema remoto actualizado e incorporan `storage_condition` y las RPC de inspección/liberación preparadas. El generador también propuso metadatos de PostgREST y cambios de formato en tipos condicionales; se identificaron como diferencias de versión/formato ajenas a la migración y se dejaron fuera. Typecheck volvió a pasar con los tipos de esquema incorporados.

La regresión SQL sobre una base limpia y `db lint` siguen pendientes porque Docker no está disponible localmente. La transición de datos en desarrollo sí quedó comprobada mediante las consultas indicadas arriba. No se ha creado commit ni publicado una rama.

**Corrección durante el recorrido manual:** el primer envío de inspección de preparación falló por ambigüedad entre la variable PL/pgSQL y la columna `quality_inspections.rejected_quantity`; la transacción no dejó una inspección parcial. Se añadió una regresión al SQL de preparación que invoca la inspección y verifica el resultado aprobado y sus cantidades. La migración correctiva `20261202000000_fix_prepared_quality_rejected_quantity_ambiguity.sql` se simuló como única pendiente y se aplicó al mismo proyecto de desarrollo. `db push --dry-run` quedó al día y una consulta a `pg_get_functiondef` confirmó la variable `v_rejected_quantity` desplegada.

**Recorrido manual en desarrollo:** la inspección de `HAM-GRATED-4f117bfa87734a66a7326fdd61a47852` quedó aprobada con muestra de 0.0500 kg, 0.0500 kg aceptados y cero rechazados; el detalle mostró el origen `MP08-MANUAL-JAMON-20261119-A` y el costo asignado de $40.0000. Calidad liberó el lote como refrigerado en `Refrigeración de materias primas`, con caducidad interna de prueba `2026-11-26` y motivo explícito. La consulta de solo lectura confirmó `available`, 0.4800 kg, `remaining_value = $38.4000`, stock agregado de 0.4800 kg, costo promedio de $80/kg, y exactamente una decisión y un movimiento de entrada. La fecha de prueba es anterior a la caducidad del lote fuente (`2026-12-19`); no define la vida útil real.

El segundo recorrido probó el tipo de almacén seco con datos técnicos no operativos. La inspección de `CHEESE-GRATED-afce1ac796234228bb205d9b731bee83` mostró el recorte y lote de queso de origen, con 0.0010 kg aprobados. Calidad lo liberó en `Almacén de secos`, con caducidad de prueba `2026-11-26` y motivo identificado como técnico. La consulta confirmó `available`, 0.2370 kg, `remaining_value = $30.8100`, stock agregado de 0.2370 kg, costo promedio de $130/kg y exactamente una decisión y una entrada. La selección de almacén seco valida el flujo del sistema; no constituye una determinación de conservación para queso rallado en operación real.

### Actualización de criterios de conservación — 2026-11-23

Esta actualización registra la decisión de Calidad/operación tomada el 2026-11-23: queso rallado y jamón rallado se conservan refrigerados y su vida útil interna sigue pendiente. Reemplaza la elección libre de almacén seco/refrigerado para el queso rallado de prueba y el paso histórico de congelar jamón rallado. Los recorridos anteriores describen datos de prueba, no una especificación vigente.

1. **Condición de ingredientes preparados.** Queso rallado y jamón rallado tienen condición refrigerada aprobada por negocio. Calidad registra esta decisión como una nueva especificación; su vida útil interna queda pendiente de definición por Calidad. La inspección consulta el lote y sus insumos, y filtra ubicaciones refrigeradas según la especificación; no ofrece almacén seco ni congelación para estos materiales. Las demás preparaciones de ingredientes usan la condición aprobada específicamente para su proceso y tampoco se congelan.
2. **Productos terminados destinados a congelación.** El inventario no vendido puede permanecer refrigerado durante la jornada. Al cierre, el saldo aún refrigerado de las presentaciones definidas para venta congelada se registra pendiente de congelación y queda apartado de reservas y picking, conservando condición y ubicación físicas. Se permite completar el cierre de jornada y mostrar la incidencia. El jefe de producción y Calidad registran cantidad, decisión, motivo, responsable y fecha. La cantidad se vuelve congelada disponible solo tras confirmarse el fin de la congelación; si se descarta, se registra como merma trazable.
3. **Productos terminados.** Discos, tequeños, empanadas y masas terminadas se destinan a almacenamiento congelado. Pueden permanecer refrigerados durante el día, pero su saldo pendiente al cierre debe quedar apartado y resolverse según la regla de jornada aprobada.
4. **Corrección del lote de prueba.** `CHEESE-GRATED-afce1ac796234228bb205d9b731bee83` se retiene y se traslada de forma trazable a refrigeración, actualizando su condición declarada. La operación conserva cantidad y valor, no crea una recepción ni una liberación y no lo vuelve disponible. La revisión y liberación posterior requieren una decisión separada de Calidad.

**Pruebas propuestas antes de implementar:** (a) liberación de queso y jamón rallados solo en ubicaciones refrigeradas y sin caducidad inventada; (b) rechazo servidor de ubicación incompatible en recepción, traslado y liberación, y traslado entre ubicaciones compatibles con trazabilidad; (c) al cierre, discos, tequeños, empanadas y masas terminadas destinados a congelación quedan pendientes y fuera de reservas/picking hasta confirmación, con repetición idempotente; (d) registrar continuación de congelación o merma con responsable, fecha y motivo; (e) retener y trasladar el lote de queso de prueba sin alterar cantidad/valor ni liberarlo, con reintento sin movimientos duplicados. El proyecto remoto de desarrollo requerirá simulacro y autorización antes de aplicar cualquier migración; la corrección del registro de prueba se resolverá mediante una operación trazable, no mediante una migración de datos obligatoria.

## Historia #8 — Compatibilidad de almacenamiento y destinos automáticos

### Cierre de #7 y propietario

La historia #7 queda completada con PR #136, fusionado como `3d1fc6c1`, CI #4283 aprobado según confirmación del usuario y recorrido manual de producción. El pendiente de la descripción desactualizada de la receta permanece por separado en `pendientes.md`.

Inventory es propietario de la compatibilidad entre condición, destino, saldo y movimiento. Warehouse administra ubicaciones y traslados físicos; Quality determina la condición aprobada y libera lotes; Production consume los destinos habituales y resuelve el inventario de producto terminado al cierre.

### Revisión de los recorridos existentes

- **Compras/recepción:** Procurement ya conserva unidades base y presentación de compra. Warehouse recibe el lote desde móvil y llama `receive_purchase_order_lot` con la ubicación elegida; la RPC valida que esté activa, pero no compara condición ni clase. Se reutiliza recepción, agregando validación de compatibilidad en el servidor.
- **Ubicaciones:** existen altas y ediciones de `inventory_locations` con código, nombre, zona y posición física. El esquema no guarda condición ni clase de destino. Las ubicaciones preexistentes no se clasificarán por nombre; permanecerán sin asignar hasta que un administrador las configure expresamente.
- **Calidad/preparaciones:** `release_prepared_ingredient_quality_lot` ya conserva cantidad y valor durante cuarentena y suma el saldo al liberar. Actualmente permite elegir `dry` o `refrigerated` y cualquier ubicación activa; falta aplicar la especificación del material, limitar opciones compatibles y mantener condición fija. Preparación de ingredientes ya identifica lotes de origen, pero todavía no presenta el destino habitual configurado en solo lectura.
- **Traslados:** no se encontró una operación de traslado de lote de materia prima que cambie ubicación con autorización y trazabilidad. Los movimientos genéricos y la edición de una ubicación no la sustituyen; hace falta una operación autorizada por administrador que conserve saldo/valor y no cambie el estado de retención.
- **Producto terminado:** `/lots/storage-conditions` y sus RPC existentes apartan, confirman y resuelven congelaciones por lote, y las condiciones afectan reservas/picking. No se encontró el cierre de jornada que marque el saldo no congelado de una presentación congelada como pendiente y aparte.
- **Empaque:** compras admite unidad base o paquete cerrado y recepción convierte presentación a unidad base. No se encontró un flujo de inventario que descuente bolsas/separadores al empacar pedidos. Ese caso queda como historia #9 pendiente en `pendientes.md`; no se incorpora a #8.

### Distribución física y alcance por ciclos

El refrigerador distingue ubicaciones de materia prima refrigerada y de semielaborados refrigerados. El congelador queda exclusivo para producto terminado, incluidos los discos y masas que tengan presentación destinada a congelación. Los empaques ocupan estantes propios y los químicos otra área separada. La condición y destino habitual se configuran explícitamente por material o preparación, sin inferencias desde nombre/código de ubicación. El queso rallado tiene condición refrigerada fija; jamón rallado también. La vida útil interna de ambos sigue pendiente de definición por Calidad.

El primer ciclo valida queso rallado: el servidor rechaza una ubicación seca y una refrigerada de materias primas; acepta una ubicación refrigerada de semielaborados tras una inspección aprobada y con la caducidad interna indicada por Calidad. La aceptación conserva el flujo vigente de liberación sin añadir otro movimiento de recepción. El lote de prueba `CHEESE-GRATED-afce1ac796234228bb205d9b731bee83` permanece pendiente de retención y corrección trazable. Puede trasladarse solo por operación autorizada y permanece fuera de disponibilidad; el traslado no lo libera. Calidad debe registrar una decisión separada para liberarlo.

Los ciclos posteriores cubren destinos automáticos en Preparación, traslado autorizado por administrador y cierre de jornada. Discos, tequeños, empanadas y masas terminadas destinadas a congelación pueden permanecer refrigerados durante el día; el saldo aún refrigerado al cierre se registra pendiente, conserva ubicación/condición reales y queda fuera de reservas/picking. Se permite cerrar la jornada mostrando la incidencia. Producción y Calidad registran cantidad, destino, motivo, responsable y fecha. Solo se habilita como congelado disponible tras confirmar el final del proceso, o se registra una merma trazable.

#### Actualización aprobada: congelación directa y espera refrigerada dedicada

Al finalizar un lote, Calidad puede liberarlo directamente a congelación en proceso o a la ubicación refrigerada de espera cuando el equipo aún no esté disponible. La ubicación real se denomina **Producto terminado refrigerado — espera de congelación**; comparte el refrigerador físico con semielaborados, pero su clase es producto terminado/refrigerado y el administrador la identificará físicamente. Las piezas en espera y en proceso quedan fuera de reservas y picking. Iniciar congelación tras espera mueve saldo entre ubicaciones y al estado en proceso sin perder el lote de armado; confirmar el final habilita únicamente las piezas terminadas como congeladas disponibles. Al cierre, los saldos refrigerados o en proceso pendientes aparecen como incidencia y requieren decisión explícita; una merma autorizada conserva cantidad, motivo, responsable, fecha y origen.

Pruebas añadidas al alcance: ambas rutas desde liberación, saldos por ubicación y estado, inicio desde espera, finalización y merma, trazabilidad al lote/orden, exclusión de ATP/picking, rechazo de ubicaciones incompatibles, cierre con incidencias y reintentos sin movimientos duplicados. La ubicación dedicada se crea explícitamente con uso `finished_product` y condición `refrigerated`, sin deducir su política por nombre. El almacén físico se comparte; las ubicaciones lógicas se mantienen diferenciadas.

**Implementación del ciclo en progreso:** la migración `20261206000000_route_finished_product_freezing_by_location.sql` crea `REF-PT-ESPERA-CONG` en la zona física `REFRIGERADOR`, clasificado como producto terminado/refrigerado, sin inventar pasillo o posición. Un trigger de liberación enruta atómicamente el lote a espera refrigerada o a congelación en proceso según la ubicación compatible elegida. Los saldos conservan ubicación por espera, proceso y congelado; la espera y el proceso se descuentan del inventario disponible. La decisión de espera puede iniciar congelación o registrar merma autorizada; la decisión del proceso también admite merma. Las operaciones conservan el lote de producción y usan claves de idempotencia.

La pantalla de liberación solo ofrece ubicaciones activas clasificadas para producto terminado refrigerado/congelado y explica las dos rutas. `/lots/storage-conditions` muestra espera, proceso, saldo congelado y mermas por ubicación; las cantidades pendientes aparecen en la sección de incidencias al cierre. Se conserva el flujo anterior para lotes históricos no clasificados, mientras la nueva pantalla requiere ubicaciones explícitamente configuradas. El congelador de producto terminado debe clasificarse por el administrador; no se infiere su clasificación a partir del nombre.

Verificación local ejecutada: `pnpm.cmd exec tsc --noEmit` pasó; `pnpm.cmd run production:test:lots` pasó (11 archivos, 83 pruebas). La regresión SQL en `finished_product_quality_release.sql` comprueba espera 9 → proceso 5 y espera 4, merma de 4, ruta directa de 6, ubicación física, trazabilidad, ATP, picking e idempotencia. Docker no está disponible, por lo que esa regresión y la reconstrucción limpia quedan pendientes de CI. No se ha aplicado esta migración al Supabase remoto; el simulacro y autorización serán necesarios antes del recorrido de desarrollo.

### Pruebas propuestas para aprobación

1. En SQL, crear datos aislados y comprobar que queso rallado refrigerado rechaza tanto una ubicación seca como una ubicación refrigerada de materias primas sin cambiar saldo, valor, ubicación, liberación ni movimientos; aceptar una ubicación refrigerada de semielaborados tras inspección aprobada y con los datos de Calidad completos.
2. Crear ubicaciones sin clasificación y confirmar que la migración/configuración no las infiere por nombre. Asignar manualmente destinos diferenciados para refrigerador de materia prima, refrigerador de semielaborado, congelador de producto terminado, estantes de empaque y área de químicos.
3. Trasladar por actor administrador un lote refrigerado entre ubicaciones compatibles; rechazar traslado incompatible o sin permiso. Comprobar que una transferencia de lote retenido conserva `quarantine/hold` y no crea entrada ni libera stock.
4. En ciclo posterior, simular el cierre para discos, tequeños, empanadas y masas terminadas destinadas a congelación; verificar apartados, reservas/picking, estado físico, resolución a congelado tras confirmación, merma, responsabilidad y reintentos sin duplicados.

### Primer ciclo de implementación: compatibilidad de queso rallado

- Se añadió la migración `20261203000000_validate_prepared_storage_compatibility.sql`: clasifica ubicaciones mediante campos explícitos de uso y condición, conserva sin clasificar las ubicaciones existentes y permite configurar condición, uso y destino habitual por materia prima. Queso rallado y jamón rallado quedan definidos como refrigerados; el destino requiere configuración administrativa explícita. Un trigger del servidor impide liberar un ingrediente preparado si su ubicación, uso o condición no coinciden con la política configurada y exige el destino habitual al liberarlo.
- La regresión `cheese_preparation_cost_reconciliation.sql` ahora verifica rechazo atómico en almacén seco y en refrigeración de materias primas, aceptación en refrigeración de semielaborados después de inspección aprobada, y que una ubicación heredada siga sin clasificar. El fixture de jamón se ajustó a ubicaciones distintas de materia prima y semielaborado.
- Resultado automatizado: CI #4309 aprobó reconstrucción limpia, db lint, regresión SQL y tipos generados (`DATABASE_TYPES_CURRENT=OK`); build y Storybook también pasaron. CI #4310 pasó para el último commit documental `c9258a6c`.
- Recorrido manual en desarrollo: se configuró explícitamente `REF-SEMI-01` como ubicación refrigerada para semielaborados y se asignó como destino de `MP-QSO-RALLADO`. El simulacro listó solo `20261204000000_retain_and_correct_prepared_ingredient_storage.sql` para el proyecto `poglpqvmbrfcvtuspvtx`; esa migración se aplicó. El lote `CHEESE-GRATED-afce1ac796234228bb205d9b731bee83` se retuvo y trasladó a Refrigeración de semielaborados, manteniendo 0.2370 kg apartados y fuera de disponibilidad. Una inspección nueva de 0.05 kg fue aprobada y Calidad lo liberó con caducidad temporal de prueba 2026-12-02; la vida útil operativa sigue pendiente de Calidad. Materias Primas mostró 0.474 kg totales de queso rallado tras la liberación, el saldo esperado sin entrada duplicada.
- Pendiente en #8: traslados autorizados entre ubicaciones compatibles (ciclo actual) y cierre de jornada con apartado de producto terminado refrigerado destinado a congelación (ciclo posterior). La configuración explícita de ubicaciones/materiales y los destinos de solo lectura en Preparación ya están disponibles. El PR #137 sigue en borrador.

### Corrección trazable del lote de queso rallado liberado en seco

La revisión del recorrido manual confirmó que `CHEESE-GRATED-afce1ac796234228bb205d9b731bee83` sigue disponible en almacén seco por una decisión anterior de prueba. Esa decisión histórica permanece intacta. Se añadió `20261204000000_retain_and_correct_prepared_ingredient_storage.sql` para que Calidad/Admin retenga el lote, lo quite del saldo disponible, conserve cantidad y valor, y actualice su ubicación/condición al destino refrigerado configurado sin liberarlo. La salida de inventario registra el lote, inspección previa, estado y ubicación anterior, destino, cantidad, valor conservado, motivo, responsable y fecha. Un reintento devuelve el mismo movimiento.

La regresión SQL modela el registro heredado con condición seca, verifica la retención y el movimiento único, rechaza que la inspección anterior lo vuelva a liberar y requiere una inspección aprobada posterior y una decisión de Calidad nueva para reingresarlo una sola vez. La pantalla de la inspección muestra la corrección solo cuando detecta que un lote preparado disponible ya no coincide con su política; después ofrece iniciar una nueva inspección.

La regresión también comprueba que, mientras está retenido, el lote conserva sus 0.237 kg y el valor que ya tenía pero se excluye del saldo agregado y del consumo FEFO; la corrección coloca el lote en una ubicación configurada como semielaborados refrigerados sin quitar el estado `hold`. Reintentar la operación atómica de retención/corrección devuelve el movimiento original. Los destinos incompatibles y una llamada sin autorización se rechazan sin cambiar lote, valor, saldo ni movimientos. La liberación posterior exige reinspección aprobada y decisión autorizada de Calidad; un intento sin autorización no escribe, y repetir la decisión válida conserva un solo movimiento de entrada y el mismo saldo y valor.

**Verificación local de este cambio:** typecheck pasó; 24 pruebas unitarias focalizadas pasaron; `git diff --check` pasó. La regresión SQL se validó en la base limpia de CI porque Docker no está instalado localmente. La migración se aplicó al proyecto Supabase de desarrollo después de revisar un simulacro que listó únicamente esa migración.

**CI #4309 pasó para `0f4622eb` en el PR #137:** `db:reset:test` reconstruyó la base desde cero y aplicó `20261204000000_retain_and_correct_prepared_ingredient_storage.sql`; `db lint`, `cheese_preparation_cost_reconciliation.sql` y `db:types:check` terminaron correctamente con `DATABASE_TYPES_CURRENT=OK`. La regresión cubrió el saldo FEFO excluido durante retención con cantidad física y valor conservados; la ubicación semielaborado refrigerado y estado `hold`; el reintento sin movimientos/descuentos duplicados; rechazo atómico de destino incompatible y actor no autorizado; rechazo de la decisión vieja, reinspección nueva aprobada, autorización para liberar y reintento sin duplicar la entrada. Build (typecheck, lint, 1,291 pruebas y build) y Storybook pasaron. No hubo diferencia adicional de tipos en esta ejecución. CI #4310 también pasó para el último commit `c9258a6c`.

**Recorrido manual en desarrollo:** se aplicó la migración tras confirmar el proyecto `poglpqvmbrfcvtuspvtx` y revisar el simulacro exacto. El lote `CHEESE-GRATED-afce1ac796234228bb205d9b731bee83` pasó de Almacén de secos a Refrigeración de semielaborados en estado retenido, con 0.2370 kg apartados y fuera de inventario disponible. La inspección nueva aprobada fue de 0.05 kg; la liberación de Calidad conservó la ubicación refrigerada y registró caducidad interna temporal 2026-12-02. Materias Primas mostró 0.474 kg de queso rallado tras liberar, sin duplicar el saldo. El dato de 14 días fue solo de prueba; la vida útil operativa sigue pendiente de Calidad. El PR #137 permanece en borrador; traslados generales y cierre de jornada siguen pendientes de ciclos posteriores.

### Segundo ciclo: traslado autorizado entre ubicaciones compatibles

- Se añadió una regresión SQL al flujo existente de preparación de queso. Cubre el traslado de un lote `hold` y de un lote `available`, la conservación de condición/cantidad/valor/estado, stock agregado inalterado, reintentos con una sola fila de auditoría, rechazo de destino incompatible, actor no administrador y reutilización de clave con otro destino.
- La migración `20261205000000_transfer_raw_material_lots_between_compatible_locations.sql` agrega la RPC administrativa `transfer_raw_material_lot_location`. La RPC bloquea el lote durante el cambio, valida en servidor el uso y condición explícitos de origen y destino, mantiene el estado actual y registra el movimiento de traslado sin entrada/salida de stock. Una clave idempotente serializa reintentos y no permite cambiar lote o destino.
- Se agregó `/inventory/lot-transfers`, enlazada desde Inventario. El operador autorizado ve condición, uso y estado de cada lote; elige solo destinos activos compatibles y proporciona motivo. La acción vuelve a autorizar y llama la RPC. Si el origen no está clasificado o no hay destino compatible, la pantalla indica la configuración administrativa pendiente. El kardex distingue el movimiento como traslado y el historial de movimientos de producto no mezcla filas de materias primas.
- Verificación local: `tsc --noEmit` pasó; 3 pruebas unitarias de Server Action pasaron. No se ejecutó la regresión SQL en local porque este equipo no tiene Docker. CI #4312 falló inicialmente por una expectativa de prueba que invertía el orden `destino/origen` de la nota de auditoría; la migración ya emitía esos campos en el orden correcto. Se corrigió la aserción y CI #4314 pasó sobre la base limpia para `f2ef071122aa6d4f168dbec36527a881c61b3696`: la migración, lint/seguridad/tipos de base, regresión SQL, typecheck, lint, pruebas, build y Storybook terminaron correctamente. El archivo exacto `database.generated.ts` descargado del artefacto de CI #4312 se incorporó en un commit separado; el chequeo de tipos generados pasó en CI #4314 sin producir otro artefacto. CI #4315 pasó en el último commit `75ec5f54` con database, build y Storybook verdes. Para el recorrido manual se confirmó el proyecto `poglpqvmbrfcvtuspvtx`; el simulacro listó únicamente `20261205000000_transfer_raw_material_lots_between_compatible_locations.sql` y esa migración se aplicó. En `/inventory/lot-transfers`, `CHEESE-GRATED-ae971126b37741359d1535287a30a0c5` se trasladó de `REF-SEMI-01` a `REF-SEMI-02`: quedó disponible con 0.237 kg y valor $30.5802. Materias Primas conservó el saldo agregado de queso rallado en 0.474 kg. Las ubicaciones originales permanecieron sin clasificación inferida. El PR #137 sigue en borrador; las incidencias de espera y proceso ya se muestran al cierre; su recorrido manual sigue pendiente.

### Tercer ciclo: rutas a congelación e incidencia de cierre

- La migración `20261206000000_route_finished_product_freezing_by_location.sql` registra la ubicación `REF-PT-ESPERA-CONG` como producto terminado refrigerado en la zona física `REFRIGERADOR`, diferenciada de semielaborados y sin inventar pasillo o posición. Calidad puede liberar el lote a esa espera refrigerada o directamente a congelación en proceso. Ambos saldos quedan fuera de reservas y picking y conservan el lote de origen.
- Desde espera refrigerada, iniciar congelación transfiere la cantidad elegida a proceso y la descuenta de la ubicación de espera. Confirmar la finalización hace disponible únicamente el excedente tras apartar las 2 piezas de inspección y 3 de retención por lote. Las cantidades que permanezcan esperando o en proceso aparecen en `/lots/storage-conditions` bajo **Incidencias al cierre y congelaciones pendientes**. El administrador puede decidir continuar la congelación o registrar merma autorizada con motivo y trazabilidad.
- La regresión `finished_product_quality_release.sql` cubre liberación en espera de 9 piezas, transferencia de 7 al proceso y conservación de 2 en espera; merma autorizada de esas 2; liberación directa de 6 al proceso; finalización, muestreo, saldos por ubicación, trazabilidad, exclusión de ATP/picking, incompatibilidades e idempotencia de reintentos.
- **CI #4323 pasó para `8be1046e68674a5f2e2f490d958a42c862192f7a` en PR #137:** base limpia, migraciones, db lint, regresiones SQL, tipos generados, typecheck, lint, pruebas, build y Storybook. Las regresiones confirmaron los movimientos de inicio ligados a la operación y el rechazo de nuevas decisiones cuando el proceso ya está resuelto. CI #4321 y #4322 detectaron aserciones SQL obsoletas; quedaron corregidas antes de la ejecución aprobada.
- **Recorrido manual en desarrollo:** se confirmó el proyecto `poglpqvmbrfcvtuspvtx`, se revisó el simulacro de `20261206000000_route_finished_product_freezing_by_location.sql` y el usuario aplicó la migración. Para `OP-48C354AB909042E699FEFBCDEA264188`, se liberaron 6 Tequeños Party por congelación directa en `CONG-PT-01`; al finalizar, 5 quedaron apartados como muestras (2 de inspección inmediata y 3 de retención) y 1 crudo congelado disponible. Trazabilidad confirmó el lote `MP08-TEQ-PARTY-DIRECTA-6-20261124`, el consumo de 6 palitos Party del lote `CHEESE-CUT-73d64f595fbe42c8ba1e8dd89882b87c` y costo de $7.80.
- **Ruta desde espera refrigerada:** para `OP-EAE2307F9AC0469486414A4B712C95B2`, 6 piezas se liberaron en `REF-PT-ESPERA-CONG`, permanecieron fuera de disponibilidad, y al iniciar congelación pasaron a proceso en `CONG-PT-01`. Tras confirmar finalización, 5 quedaron apartadas para Calidad y 1 congelada disponible. Trazabilidad confirmó el lote `MP08-TEQ-PARTY-ESPERA-6-20261124`, los mismos 6 palitos Party del lote de origen y costo de $7.80. En ambos recorridos se conservaron 6 piezas de producción bruta.
- **Corrección operativa durante la prueba:** se inició por error una congelación de 6 piezas en `MP05-TEQ-PARTY-48-20261117`. Calidad confirmó que seguían sin congelarse y bajo condiciones aprobadas, y autorizó su retorno trazable a fresco. El saldo del lote regresó a 27 frescas, 7 crudas congeladas y 6 en proceso; no se borró el movimiento ni se cambió el estado de piezas ya congeladas.
- **Correcciones de los hallazgos de interfaz:** las tarjetas de congelación se identifican por `operation_id`; cantidad, destino, verificación y motivo usan nombres de campo específicos de esa operación, y el servidor lee únicamente los campos asociados al ID enviado. Se desactiva el autocompletado en el formulario, evitando que entradas con nombres genéricos de incidencias hermanas se reutilicen. Para disponibilidad, el cálculo ahora usa `max(requerido − consumido, 0)` y compara el saldo disponible con ese pendiente; el faltante visible es únicamente `max(pendiente − disponible, 0)`.
- **Regresiones automatizadas:** `storage-conditions-client.test.tsx` renderiza dos incidencias del mismo lote (1 y 6 pendientes, con motivos distintos), verifica la asociación de cada tarjeta y formulario, y confirma que editar una no modifica la otra. `storage-actions.test.ts` envía ambos grupos de campos y confirma que la acción manda a la RPC solo cantidad, destino y motivo de la operación seleccionada. `production-order-contract.test.ts` confirma que una orden de 6/6 consumidos no tiene faltante aunque queden 3 piezas en stock y que una orden con 50 requeridas, 30 consumidas y 5 disponibles informa pendiente 20 y faltante 15. Resultado: Vitest, 3 archivos y 18 pruebas aprobadas. ESLint focalizado y `tsc --noEmit` aprobados.
- **Verificación manual en navegador pendiente:** intenté abrir el navegador de desarrollo con la herramienta de uso de computadora, pero el entorno devuelve `browsers: []` y `Computer Use native pipe is unavailable`. Por eso los dos recorridos se cubrieron con regresiones de componente/acción y contrato, pero todavía no se afirma que se hayan repetido manualmente en navegador. PR #137 permanece en borrador hasta completar ese recorrido y confirmar CI para el último commit.
