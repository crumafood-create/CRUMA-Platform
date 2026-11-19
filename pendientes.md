# Historias pendientes para retomar

Estas historias se conservan aquí hasta que el usuario decida activarlas. Las historias #3 y #4 fueron activadas; #3 está completada y #4 está activa en `backlog.md`.

## Contexto

CRUMAFOOD necesita completar el recorrido de registrar productos y materias primas, definir recetas con ingredientes y rendimiento, y crear órdenes de producción, manteniendo coherencia entre pantalla, servidor y base de datos.

Stack: el existente en CRUMA, sin cambios propuestos.

Decisiones acordadas: solo CRUMAFOOD y una planta, sin sucursales ni franquicias; administrador mediante la autorización global vigente; primera versión con conexión, en español y MXN. No se crean tenant, organización, planta, campos ni columnas sin un consumidor real identificado. No se activa la autorización por organización pendiente del ADR-0017.

## Historias

1. [x] Como administrador autorizado, quiero registrar productos con datos y estados válidos para utilizarlos en el catálogo.
2. [x] Como administrador autorizado, quiero registrar materias primas con datos válidos para utilizarlas en mis recetas. **Completada:** alta y edición del catálogo, unidad base obligatoria/protegida y alta desde compras están integradas; ver las historias cerradas en `backlog.md` y su evidencia en `plan.md`.
La historia de productos (#1) está completada e integrada; ver el historial de entregas en `backlog.md`.

## Entregas relacionadas completadas

- [x] **MP-01.** Comprar presentaciones comerciales y convertirlas a unidad base. PR #126, CI y recorrido manual en Supabase de desarrollo aprobados; evidencia en `plan.md`.
- [x] **WH-01.** Consultar desde el móvil órdenes que admiten recepción y abrir su detalle. PR #127; evidencia en `backlog.md` y `plan.md`.

## Requisito diferido: porciones de producto terminado

- Cada porción de un lote terminado debe identificar preparación, condición de almacenamiento y cantidad en piezas. Al congelar, se descuentan piezas del saldo de origen y se agregan al congelado con trazabilidad. Los envíos foráneos usan saldo congelado solo para productos habilitados en la ruta. No forma parte de la primera entrega activa de la historia #4.

## Referencia de negocio para recetas (#3)

- Para el MVP, cada combinación de tamaño y relleno será un producto distinto, con su propia receta. Combinaciones definidas: tequeños tradicionales y Party × queso, pizza (pepperoni con queso) y chocolate; empanadas tradicionales y minis × queso y jamón con queso. No se trata el tamaño o relleno como opciones variables de un mismo producto.
- Cada variedad de masa es un producto intermedio distinto y tiene su propia fórmula. La receta de la masa actual utiliza sus ingredientes para producir el lote estándar de **2 kg**; otras variedades pueden tener rendimientos distintos.
- Si los 2 kg se destinan a un solo producto, los rendimientos esperados aproximados son: Tequeños Party, **100 piezas**; Tequeños tradicionales, **60 piezas**; masa estirada, **4 láminas**; tapas para empanadas #14, **36 tapas**.
- Una lámina cuenta como una pieza; una tapa cuenta como una pieza.
- Empaque, separado del rendimiento: 4 láminas equivalen a **4 paquetes de 1 lámina**; 36 tapas #14 equivalen a **3 paquetes de 12 tapas**. El empaque de tequeños está **por definir**.
- Ejemplo de planificación, no una orden: destinar 1 kg a unas 50 piezas Party y 1 kg a reponer aproximadamente 30 piezas tradicionales.
- Los rendimientos son aproximados y describen el resultado esperado; la ejecución registrará aparte el resultado real.
- Cambio mínimo acordado: reutilizar `products` para cada variedad intermedia y extender `recipe_items` para que un ingrediente pueda referenciar una materia prima o un producto intermedio. Cada receta final referencia una sola variedad de masa. Las materias primas pueden usarse aunque su existencia sea cero; la carga inicial de stock se hará mediante compra y recepción.

## Flujo de trabajo

Refinar una historia a la vez con [SKILL_story](skills/story/SKILL_story.md), luego implementar con [SKILL_pair](skills/pair/SKILL_pair.md). Mantener las historias breves según [SKILL_backlog](skills/backlog/SKILL_backlog.md); el contexto general se conserva en [AGENTS.md](AGENTS.md).

## Compras y recepción de materias primas

- [x] **MP-02.** Como responsable de compras, quiero cambiar el proveedor de una orden borrador conservando sus renglones, para revisar y corregir sus precios antes de confirmarla. **Completada:** PR #129 fusionado; CI #4193 pasó la prueba SQL y el cierre documental entró por PR #131.
  - **Prioridad:** P2.
  - **Motivo:** cambiar de proveedor es necesario en algunos recorridos, pero la alternativa temporal es crear otro borrador; una orden confirmada no se modifica.
  - **Módulo propietario:** Procurement.
  - **Regla acordada:** cada orden tiene un proveedor; al cambiarlo se conservan los renglones y sus precios no se recalculan automáticamente.

## Calidad: reglas pendientes de habilitación

- **Cocidos congelados:** cantidad confirmada de inspección inmediata de 2 piezas y retención de 2 piezas; aún no se habilita en la implementación inicial de muestreo.
- **Masa sin levadura:** 0.100 kg por lote es referencia pendiente de confirmación; falta decidir si se guarda una porción adicional de retención.
- **Discos #14, lote común:** falta definir la cantidad de inspección inmediata y si la retención común será exactamente 2 o 3 discos.
- **Discos #14, lote mensual seleccionado:** 12 discos en paquete comercial cerrado para empaque/duración; falta confirmar si sustituyen la retención común y definir la cantidad de inspección inmediata.
- **Productos con levadura:** no habilitar hasta confirmar fórmulas y controles por etapa; la retención propuesta de 4 piezas crudas congeladas y 2 cocidas congeladas está pendiente de validar por presentación.

## Hallazgos pendientes del recorrido manual de consumo de queso (#7)

- [ ] **Navegación al liberar una orden:** al pulsar «Liberar Orden» en la orden `OP-31C49AC0A6DB42178B9C2CB61BDE1EA3`, el primer envío redirigió inesperadamente a la edición de ingredientes de la receta (`/recipes/75fce806-320f-424a-ac5c-c38acc960781/ingredients`). Al volver a intentar, se abrió el detalle correcto y la orden quedó en estado **Liberada**. Revisar el destino posterior a la acción y corregir la navegación; no se observó pérdida de la orden.
- [ ] **Descripción de receta desactualizada:** la descripción de «Receta Tequeños Party Queso» aún dice «El rendimiento aproximado usa 2 kg de masa y 1 kg de Queso cheddar fuerte», aunque el ingrediente activo se cambió a **100 palitos de queso Party** por cada 100 piezas. El detalle de la orden y la pantalla móvil identificaron y consumieron correctamente el material Party, por lo que el texto no cambió la presentación surtida; sigue siendo confuso y debe actualizarse para reflejar la fórmula vigente.
