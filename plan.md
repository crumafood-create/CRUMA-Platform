# Historia completada: saldos iniciales trazables de materia prima

## Story

Como administrador de inventario, quiero que una materia prima nueva empiece con stock actual y costo promedio en cero, para que el saldo físico inicial se registre mediante el flujo de compras y quede trazable.

## Módulo propietario

**Inventory** — es propietario de movimientos y saldos. Warehouse opera la recepción física. La propiedad de las reglas de cálculo de costos permanece pendiente de conciliación; esta historia no la decide.

## Criterios de aceptación aprobados

- [x] Dado que creo una materia prima, cuando veo la sección Inventario, entonces Stock Actual y Costo Promedio aparecen en cero y no se pueden editar.
- [x] Dado que envío la creación con valores distintos de cero para stock o costo, cuando se guarda la materia prima, entonces ambos valores quedan en cero y los valores enviados no alteran el resultado.
- [x] Dado que inicio el alta desde el catálogo general o desde los renglones de una orden en borrador, cuando la materia prima se guarda correctamente, entonces desde el catálogo permanezco allí con confirmación de éxito y acceso a compras; desde la orden regreso a esa misma orden con la materia prima seleccionada, sin agregar el renglón hasta que confirme sus condiciones.

## Plan aprobado

- Mostrar stock actual y costo promedio iniciales en cero y solo lectura al crear una materia prima.
- Asegurar que el alta del servidor persista ambos valores en cero aunque la petición incluya otros.
- Desde el catálogo general, confirmar el alta y ofrecer acceso a compras.
- Desde los renglones de una orden, ofrecer el alta de una materia prima faltante y, al guardarla, regresar a esa misma orden con el artículo seleccionado; no agregar el renglón automáticamente.
- Dejar como verificación de integración futura el recorrido de recepción por orden y liberación de Calidad, comprobando existencias físicas y disponibles sin duplicar movimientos.

## Fuera del alcance

- Editar stock o costos de materias primas existentes.
- Definir o cambiar la fórmula y propiedad del costo promedio.
- Cambiar la recepción, la liberación de Calidad o los movimientos existentes.
- Resolver los otros cinco hallazgos, que se mantienen como candidatos a historias separadas.

## Pruebas aprobadas

| Prueba | Capa responsable |
|---|---|
| `RawMaterialForm_showsStockAndAverageCostAsZeroAndReadOnly` | Componente del formulario |
| `createRawMaterial_persistsZeroStockAndAverageCostDespiteSubmittedValues` | Acción del servidor |
| `rawMaterialCatalog_offersPurchaseOrderLinkAfterCreation` | Página del catálogo |
| `purchaseOrderItems_offersMissingMaterialCreationWithOrderContext` | Página de renglones de compra |
| `createRawMaterial_fromPurchaseOrderReturnsToSameOrder` | Acción del servidor |
| `rawMaterialCatalog_confirmsSuccessfulCreation` | Página del catálogo |
| `createRawMaterial_fromPurchaseOrderReturnsWithMaterialSelected` | Acción del servidor |
| `purchaseOrderItems_preselectsCreatedMaterialWithoutAddingLine` | Página y formulario de renglones de compra |

### Verificación de integración pendiente

- Resultado esperado: la recepción registra una sola vez la cantidad física recibida, el lote y su ubicación; Calidad muestra su estado y, al liberar el lote, lo habilita para consumo sin volver a registrar la entrada.
- Resultado obtenido: no ejecutado manualmente en esta revisión. La historia de navegación y selección se verificó mediante las pruebas aprobadas; no se afirma que el recorrido integral haya sido validado.
- Diferencias: queda pendiente contrastar en desarrollo las existencias físicas y disponibles y los movimientos del flujo compra → recepción → Calidad.

## Avance de Pair

Ciclo 1 completado: `RawMaterialForm_showsStockAndAverageCostAsZeroAndReadOnly` falló porque los campos eran editables; pasó al mostrarlos en cero y como solo lectura durante la creación. El formulario de edición conserva su comportamiento actual.

Ciclo 2 completado: `createRawMaterial_persistsZeroStockAndAverageCostDespiteSubmittedValues` falló porque el alta enviaba los valores recibidos al INSERT; pasó al fijar stock y costo promedio en cero en la acción del servidor.

Ciclo 3 completado: `rawMaterialCatalog_offersPurchaseOrderLinkAfterCreation` falló porque el catálogo no ofrecía acceso a compras; pasó al agregar el enlace a crear una orden. El primer reintento agotó el timeout global de 5 segundos; con un límite de 15 segundos pasó sin cambiar la expectativa.

Ciclo 4 completado: `purchaseOrderItems_offersMissingMaterialCreationWithOrderContext` falló porque la pantalla de renglones no ofrecía el alta de materias primas; pasó al agregar el enlace con el ID de la orden y mostrarlo únicamente mientras está en borrador.

Ciclo 5 completado: `createRawMaterial_fromPurchaseOrderReturnsToSameOrder` falló porque la acción no recibía el contexto de la orden; pasó al enlazar el ID desde la página de alta y regresar a sus renglones después de guardar. El alta iniciada sin orden conserva el retorno al catálogo.

El alcance aprobado ahora incluye confirmar el éxito del alta desde el catálogo y regresar desde compras con la materia prima seleccionada, sin crear el renglón. La prueba de confirmación desde el catálogo pasó; las pruebas de retorno con preselección quedan pendientes. Cancelación, errores con conservación de datos y aviso sobre captura de compra pendiente quedan en la historia posterior del backlog.

Ciclo 6 completado: `rawMaterialCatalog_confirmsSuccessfulCreation` falló porque el catálogo no mostraba confirmación después del alta; pasó al regresar con una marca de éxito y presentarla en el catálogo. La prueba verificó el mensaje accesible de confirmación.

Ciclo 7 completado: `createRawMaterial_fromPurchaseOrderReturnsWithMaterialSelected` falló porque la acción regresaba solo el ID de la orden; pasó al recuperar el ID generado de la materia prima y agregarlo al destino de retorno. El renglón de compra no se crea desde el alta.

Ciclo 8 completado: `purchaseOrderItems_preselectsCreatedMaterialWithoutAddingLine` falló porque el formulario dejaba vacía la materia prima al volver; pasó al usar el ID de retorno solo si corresponde a una materia prima activa disponible. La prueba confirma que no se creó ningún renglón automáticamente.

Las ocho pruebas aprobadas están completadas. Los comportamientos de alta desde catálogo y retorno a la misma orden con el material seleccionado quedan cubiertos por pruebas de página, formulario y acción. El recorrido manual integral compra → recepción → Calidad queda como verificación futura y no bloquea esta historia, conforme a la decisión del usuario.
