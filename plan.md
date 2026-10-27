# Historia: conservar la captura al crear una materia prima desde compras

## Story

Como administrador autorizado, quiero cancelar el alta o recuperarme de errores y capturas pendientes al crear una materia prima desde compras, para no perder mi trabajo.

## Módulo propietario

**Procurement** es propietario de las órdenes y sus condiciones. **Inventory** conserva los datos del alta de materia prima y muestra sus errores. **app** coordina la salida, el retorno a la misma orden y la selección del material creado.

La ubicación física del formulario de materia prima en `warehouse/components` no modifica su propiedad lógica. No se trasladan reglas entre módulos ni se crea otro módulo.

## Criterios de aceptación aprobados

- [x] Dado que el alta de materia prima falla por validación o persistencia, cuando vuelvo al formulario, entonces se conservan sus campos editables y se muestra el error.
- [x] Dado que hay datos sin guardar en los renglones de una orden en borrador, cuando abro el alta de una materia prima y la cancelo, entonces regreso a la misma orden con la captura pendiente recuperada y sin crear la materia prima ni un renglón.
- [x] Dado que creo correctamente una materia prima desde esa orden, cuando regreso a los renglones, entonces se muestra seleccionada la materia prima nueva, se recuperan los demás datos pendientes de compra y todavía no hay un renglón agregado.
- [x] Dado que la materia prima está seleccionada y confirmé los datos del renglón, cuando pulso **Agregar**, entonces se crea un solo renglón con la cantidad y el costo confirmados.

## Reglas aprobadas para la captura pendiente

- Guardar en `sessionStorage` solo materia prima, cantidad y costo unitario; conservar los valores como cadenas, incluso si están incompletos.
- Asociar la captura al ID del usuario y al ID de la orden. No restaurarla para otra orden o usuario.
- Al cancelar el alta, regresar a la misma orden con la captura recuperada. Al crear la materia prima, seleccionar la nueva y recuperar cantidad y costo.
- Si el usuario empieza a editar el formulario, no sobrescribir esos cambios con una restauración posterior.
- Un error al agregar el renglón conserva la captura para corregir y reintentar. Un alta de materia prima o una restauración nunca agrega el renglón automáticamente.
- Un alta exitosa del renglón limpia la captura pendiente de esa orden. **Descartar captura** borra solo esos valores pendientes y conserva los renglones guardados.
- El servidor conserva la validación de permisos, estado de la orden y datos definitivos. No se agregan tablas ni un sistema genérico de borradores.

## Plan aprobado

- Conservar los campos editables del alta de materia prima y devolver el motivo del rechazo sin perder esa captura. Inventory mantiene esta responsabilidad.
- Conservar la selección de materia prima, cantidad y costo unitario pendientes del renglón de compra mediante `sessionStorage` por usuario y orden. Procurement mantiene esta responsabilidad.
- Hacer que `app` coordine cancelación, retorno a la misma orden y selección del material recién creado.
- Mantener separadas la creación de la materia prima y la creación del renglón; únicamente **Agregar** confirma este último.
- Respetar la autorización vigente y la validación del estado borrador existentes, sin agregar campos ni columnas.

## Fuera del alcance

- Agregar automáticamente el renglón al crear la materia prima.
- Cambiar stock, costos de inventario, recepción o liberación de Calidad.
- Persistir la captura después de cerrar la pestaña o el navegador.
- Crear módulos, campos, columnas o un sistema genérico de borradores.

## Estado de los ciclos

- Ciclo 2: implementado y recorrido manualmente; cancelar el alta regresó a la misma orden con la captura intacta.
- Ciclo 3: automatizado y recorrido manualmente; la materia prima nueva tuvo prioridad, y cantidad y costo se restauraron sin crear un renglón.
- Ciclo 4: formulario y server action cubiertos por pruebas automatizadas. En desarrollo se comprobaron el guardado, el rechazo de un material ya incluido, la retención tras recargar y la limpieza explícita de la captura.
- El test SQL adicional de persistencia única está en `supabase/tests/database/rls_behavior.sql`; no se ejecutó localmente porque no hay Docker. La regla existente de una misma materia prima por borrador se conserva en `purchase-order-repository.test.ts` y en el RPC.
- Verificación automática: `pnpm run typecheck` pasó. Las pruebas enfocadas del ciclo 4 pasaron: 19 pruebas en 4 archivos.

## Verificación manual realizada en desarrollo

| Paso | Resultado esperado | Resultado observado |
|---|---|---|
| Captura inicial | Una orden en borrador con una línea existente; seleccionar harina, cantidad 3.5 y costo 30.25. | La orden tenía una línea de 200 a $20.00, total $4,000.00. Se capturó harina, 3.5 y $30.25. |
| Cancelar el alta | Volver a la misma orden; conservar la captura y no añadir otra línea. | Regresó a la misma orden con harina, 3.5 y $30.25. La única línea existente permaneció sin cambios. |
| Crear la materia prima | Volver a la orden con la materia prima nueva seleccionada, cantidad y costo restaurados, todavía sin otra línea. | Se creó “Harina prueba manual 271027 A”; regresó seleccionada con 3.5 y $30.25. Seguía habiendo una línea. |
| Pulsar **Agregar** | Persistir un renglón con los valores confirmados y limpiar la captura. | Apareció una segunda línea: 3.5, costo $30.25, total $105.88. La línea original siguió intacta y los campos quedaron vacíos. |
| Salir y volver a los renglones | Conservar ambos renglones y no restaurar la captura ya agregada. | Los dos renglones persistieron; materia prima, cantidad y costo quedaron vacíos. |
| Rechazo al agregar | Mostrar un error seguro, conservar la captura y no modificar los dos renglones. | Al intentar agregar Harina de trigo, ya incluida, apareció el mensaje genérico; 1.25 y $9.50 permanecieron y los renglones no cambiaron. |
| Recargar con captura pendiente | Restaurar material, cantidad y costo; conservar los dos renglones. | Tras Ctrl+R se restauraron Harina de trigo, 1.25 y $9.50; los dos renglones siguieron intactos. |
| **Descartar captura** | Limpiar únicamente los valores pendientes. | Los campos quedaron vacíos; los dos renglones persistieron. |

Diferencias observadas: ninguna en el recorrido realizado. La rama de error del alta de materia prima se cubrió con pruebas automatizadas y no se provocó manualmente.
