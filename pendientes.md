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

- [ ] **MP-02.** Como responsable de compras, quiero cambiar el proveedor de una orden borrador conservando sus renglones, para revisar y corregir sus precios antes de confirmarla.
  - **Prioridad:** P2.
  - **Motivo:** cambiar de proveedor es necesario en algunos recorridos, pero la alternativa temporal es crear otro borrador; una orden confirmada no se modifica.
  - **Módulo propietario:** Procurement.
  - **Regla acordada:** cada orden tiene un proveedor; al cambiarlo se conservan los renglones y sus precios no se recalculan automáticamente.
