# Plan de compras y gestión de materias primas

## MP-01 activa: comprar presentaciones comerciales y convertirlas a unidad base

### Historia

Como responsable de compras, quiero registrar la presentación y el precio comercial de cada compra y convertir la cantidad a la unidad base de la materia prima, para comparar y recibir compras sin duplicar artículos.

### Módulo propietario y fuentes de verdad

**Purchasing/Procurement** es propietario de las órdenes, presentaciones y condiciones comerciales. **Catalog** mantiene la unidad base. **Warehouse** registra la recepción física y la aceptación o rechazo explícitos. **Inventory** conserva lotes, saldos y valoración. El flujo coordina estos datos sin crear escritores competidores.

### Criterios de aceptación aprobados

- [ ] Dada una orden en borrador, cuando se agrega una materia prima en su unidad base o en una presentación comercial conocida al comprar, entonces el renglón conserva la presentación y el precio acordados para esa compra, convierte la cantidad a la unidad base, muestra el importe comercial como referencia y permite comparar su costo por kg o litro. La compra directa en unidad base admite cantidades fraccionarias; las presentaciones cerradas requieren unidades enteras. El cálculo usa la precisión existente y no reconstruye el importe desde un costo unitario previamente redondeado.
- [ ] Dada una orden con presentación solicitada, cuando se registra una recepción parcial, entonces solo las cantidades aceptadas explícitamente y conformes con la presentación solicitada se contabilizan como recibidas; un bulto abierto o incompleto puede rechazarse y queda pendiente la cantidad no recibida. No se crea un subsistema de rechazos sin revisar el mecanismo existente.
- [ ] Dada una orden con flete, cuando se agregan, modifican o retiran renglones, entonces se conserva el flete y el total se recalcula como productos más flete. El flete no afecta el costo promedio de inventario; las compras anteriores conservan su interpretación en unidad base y sus importes históricos.

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

- Implementación preparada en una rama aislada desde `origin/main`; no se han hecho commits, publicaciones ni cambios en Supabase remoto.
- Pruebas automatizadas locales enfocadas: 65 aprobadas en 9 archivos; `typecheck`, lint y `git diff --check` aprobados.
- La migración y `purchase_order_presentations.sql` están conectadas a `db:test:security` y, por esa vía, a `db:verify`; su ejecución de integración desde una base reconstruida queda pendiente de CI porque Docker no está disponible localmente.
- Los tipos generados de base de datos no se modificaron manualmente. La regeneración y comprobación contra esta migración siguen pendientes de CI o de un entorno local con Supabase/Docker.
- El recorrido manual en navegador compra → edición/flete → recepción parcial/rechazo → lote en cuarentena queda pendiente. No se ha afirmado aún la integración con el costo promedio en ejecución real.
- `next-env.d.ts` presenta una diferencia generada ajena a MP-01 y debe permanecer fuera del cambio.

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
