# Historia: ajustar cantidad de materias primas por lote disponible

## Story

Como responsable de inventario, quiero corregir con un motivo la cantidad de un lote disponible, para mantener coherentes sus existencias y su historial de movimientos.

## Módulo propietario

**Inventory** es propietario de movimientos, saldos, lotes y ajustes según `docs/architecture/business-core.md`. **Warehouse** aporta la ubicación física del lote como contexto; el ajuste no cambia esa ubicación. No se crea otro módulo ni se agregan tablas.

## Criterios de aceptación aprobados

- [x] Dado un lote existente en estado `available`, cuando un usuario autorizado registra una cantidad positiva y finita con motivo obligatorio para aumentarlo o disminuirlo, entonces el ajuste se aplica en la unidad base, identifica el lote y conserva su ubicación, costo unitario y `last_cost`.
- [x] Dado un lote en cuarentena, retenido o rechazado, una cantidad inválida, un motivo ausente o una disminución superior al saldo, cuando se solicita el ajuste, entonces el servidor lo rechaza sin modificar lote, saldo, valoración ni movimientos.
- [x] Dado un ajuste válido, cuando se confirma, entonces la cantidad del lote, el saldo agregado, `average_cost` según la regla acordada y el movimiento de entrada o salida quedan actualizados en una sola operación; al llegar a cero el lote queda `depleted` y el último promedio se conserva.

## Reglas de negocio acordadas

- Solo se ajustan lotes existentes en estado `available`; no se ajustan lotes en cuarentena, retenidos ni rechazados.
- El usuario identifica el lote junto con la ubicación actual. La ubicación se obtiene del lote y se muestra como contexto; no puede cambiarse aquí porque cambiarla corresponde a una transferencia.
- El ajuste corrige una diferencia comprobada de cantidad y exige motivo.
- Los aumentos y disminuciones se registran como movimientos `entry` o `exit`, con cantidad positiva. No se usa el tipo `adjustment` para operaciones nuevas.
- La validación de autorización, estado del lote, cantidad positiva y finita, motivo y saldo se realiza en el servidor.
- Una disminución no puede dejar saldo negativo. Si el lote llega a cero, su estado cambia a `depleted`.
- El costo unitario del lote y `last_cost` no cambian con el ajuste.
- **Aumento:** recalcular el promedio ponderado a partir del saldo y promedio anteriores y la cantidad aumentada valorada al costo unitario del lote; redondear a cuatro decimales.

  ```text
  nuevo_promedio =
    (saldo_anterior × promedio_anterior
     + cantidad_aumentada × costo_unitario_del_lote)
    / (saldo_anterior + cantidad_aumentada)
  ```

- **Disminución:** conservar `average_cost`, siguiendo el comportamiento vigente del consumo.
- **Saldo agregado en cero:** conservar el último `average_cost`; con cantidad cero no representa existencias con valor.
- El promedio debe calcularse con los valores anteriores leídos bajo la misma protección transaccional que actualiza el lote, saldo y movimiento.
- La entrada física y la carga de stock inicial siguen el flujo de orden de compra y recepción.
- Los registros históricos de movimiento `adjustment` permanecen intactos; no se les asigna dirección ni efecto retroactivo.
- Los datos iniciales de integración deben ser coherentes entre saldo agregado, lotes y movimientos.
- La atomicidad se verifica provocando un error después de una escritura intermedia y comprobando que no persiste ningún cambio, incluido el promedio.

## Plan aprobado

- Mostrar lotes disponibles seleccionables con su ubicación actual y capturar cantidad y motivo obligatorio en la unidad base.
- Validar en el servidor autorización vigente, cantidad positiva y finita, motivo, estado actual del lote y saldo suficiente para una disminución.
- Registrar aumentos como entradas y disminuciones como salidas, vinculadas al lote y auditables con el motivo.
- Actualizar el lote, el saldo agregado y la valoración puntual de forma atómica, conservando costo unitario y `last_cost`.
- Mantener fuera del cambio la política general de valoración, la recepción de mercancía y el significado de movimientos históricos `adjustment`.

## Pruebas aprobadas

| Prueba | Capa |
|---|---|
| Aumento de lote disponible con costo distinto del promedio actual: promedio ponderado correcto, redondeo a cuatro decimales, costo de lote y `last_cost` intactos | Integración de base de datos |
| Disminución: promedio conservado, saldo no negativo, costo de lote y `last_cost` intactos | Integración de base de datos |
| Lote agotado: cantidad cero, estado `depleted` y promedio agregado conservado cuando corresponda | Integración de base de datos |
| Rechazo de lote en cuarentena, retenido o rechazado; cantidades inválidas; motivo ausente; disminución excesiva | Integración de base de datos |
| Rechazo por falta de autorización | Integración de base de datos |
| Lote, saldo agregado y movimiento se actualizan juntos; un fallo provocado tras una escritura intermedia revierte también el promedio | Integración de base de datos |
| Selección de lote y ubicación como contexto, captura de cantidad y motivo, y revisión del saldo y kardex resultantes | Verificación manual |

## Fuera del alcance

- Rediseñar la política general de valoración; solo se implementa el efecto puntual aprobado para estos ajustes.
- Cambiar el costo unitario del lote o `last_cost`.
- Ajustar lotes que no estén `available`, liberar Calidad, cambiar ubicaciones o transferir lotes.
- Crear compras, recepciones o lotes para aumentos; la entrada física y el stock inicial se registran por compra.
- Reinterpretar o actualizar movimientos históricos `adjustment`.
- Crear tablas nuevas.

## Estado de implementación

- Criterios, alcance, valoración y lista de pruebas aprobados.
- Ciclo 1 TDD (aumento y promedio ponderado): rojo confirmado manualmente en Supabase de desarrollo con `42883`, porque la función aún no existía.
- Se añadió `supabase/tests/database/raw_material_lot_adjustment.sql`. El fixture usa un administrador existente con asignación explícita en `user_roles`, datos iniciales coherentes y termina en `ROLLBACK`.
- La migración `20261027010000_add_raw_material_lot_adjustment.sql` se aplicó en Supabase de desarrollo. La prueba SQL completa se ejecutó manualmente y devolvió el ID de movimiento `9b360c7c-469d-40e5-9a53-98181b54a7ea`; no se reportaron errores de aserción.
- Ciclo 2 TDD (disminución y promedio conservado): rojo confirmado manualmente con `22023` mientras la función solo aceptaba `entry`. Se añadió y aplicó `20261027020000_extend_raw_material_lot_adjustment.sql`; la prueba SQL completa volvió a ejecutarse y devolvió el ID de movimiento `425eaa41-b19b-4f3c-94e6-8c133b4cba12`, sin errores de aserción reportados.
- La funcion SQL, la accion autorizada y la pagina dedicada cargan lotes disponibles con materia prima, saldo, unidad y ubicacion. El listado diferencia ambos flujos y la pantalla generica ofrece solo productos. El recorrido manual se completo el 2026-10-28.
- El script SQL del repositorio no se ejecutó localmente: requiere Docker, que no está disponible. La evidencia de este ciclo es la ejecución manual en Supabase.

- Ciclo 3 (agotamiento de lote y saldo agregado): verificacion manual ejecutada en Supabase de desarrollo el 2026-10-27; la consulta devolvio el ID 73b9da31-03f3-4928-a105-e9b498752190 sin errores de asercion. El SQL comprobo que ambos lotes quedan agotados, el saldo agregado llega a cero y se conservan el promedio 2.3333, last_cost y los costos unitarios.

- Ciclo 4 (rechazo sin autorizacion): verificacion manual ejecutada en Supabase de desarrollo el 2026-10-27. El script completo termino sin error reportado; el bloque comprobo rechazo bajo authenticated con una identidad sin asignacion admin y ausencia de escrituras.
- Ciclo 5 (rechazo de cantidades no positivas o no finitas y motivo vacio): verificacion manual ejecutada en Supabase de desarrollo el 2026-10-27; el script completo devolvio la identidad admin de prueba y no se reportaron errores. Las aserciones comprobaron que los datos permanecieran intactos.
- Ciclo 6 (rechazo de disminucion mayor que la cantidad del lote): verificacion manual ejecutada en Supabase de desarrollo el 2026-10-27; el script completo devolvio la identidad admin de prueba y no se reportaron errores. Se comprobaron saldos, promedio, lotes y movimientos sin cambios.
- Ciclo 7 (rechazo por estado de Calidad no disponible): verificacion manual ejecutada en Supabase de desarrollo el 2026-10-27; el script completo devolvio la identidad admin de prueba y no se reportaron errores. Se cubrieron cuarentena, retenido y rechazado, sin cambios en saldo, promedio ni movimientos.
- Ciclo 8 (rollback ante fallo despues de escrituras intermedias): verificacion manual ejecutada en Supabase de desarrollo el 2026-10-27; el script completo devolvio la identidad admin de prueba y no se reportaron errores. El fallo simulado al insertar el movimiento no dejo cambios en los lotes, el saldo, el promedio ni el historial.
- Ciclo 9 (accion autorizada invoca la RPC con lote, tipo, cantidad y motivo): rojo confirmado porque la exportacion no existia; implementacion minima agregada y prueba focalizada verde (1 test). La accion usa una firma local acotada para la RPC porque el tipo generado aun no la incluye; no se modificaron tipos generados.
- Ciclo 10 (formulario lista lotes y contexto de ubicacion): el rojo inicial exigia seleccionar un lote por defecto, comportamiento no acordado. Se corrigio la expectativa para verificar opcion visible, selector obligatorio inicialmente vacio, ubicacion asociada en la opcion y ausencia de campo de ubicacion editable. El formulario no cambio; test focalizado verde (1 test).
## Separación de flujos aprobada

- El ajuste genérico conserva su comportamiento para productos.
- El ajuste genérico rechaza `item_type = raw_material` en el servidor antes de cualquier escritura.
- El ajuste de materia prima se inicia desde un acceso diferenciado, permite seleccionar solo lotes disponibles y ejecuta la RPC autorizada. La RPC vuelve a validar el estado vigente del lote al momento de guardar.
- El listado de ajustes ofrece accesos diferenciados a ajuste de productos y ajuste de materias primas por lote, ambos dentro de Inventory.
- La revisión de otros caminos de escritura, incluida la edición de saldos desde el catálogo, queda pendiente como trabajo independiente.

Pruebas agregadas al alcance aprobado:
- `createInventoryAdjustment_rejectsRawMaterialBeforeAnyWrite`.
- `createInventoryAdjustment_keepsProductAdjustmentsWorking`.
- `adjustRawMaterialLotQuantity_callsAuthorizedRpcWithLotAndAdjustmentData` y rechazo de la RPC sin escrituras locales.
- La página de Inventory solo ofrece lotes disponibles y muestra su materia prima, cantidad y ubicación.
- Verificación manual: probar ambos accesos, ajuste de producto, ajuste de lote, lote que pierde disponibilidad y saldo/promedio/kardex después del guardado.

- Ciclo 11 (acción genérica rechaza materias primas antes de escribir): rojo confirmado porque la acción completaba la inserción; se añadió una validación temprana tras la autorización. Prueba focalizada verde (2 tests), incluyendo el RPC autorizado existente.
- Ciclo 12 (ajuste genérico conserva el comportamiento para productos): la prueba focalizada pasó verificando la inserción de un movimiento de producto con sus campos actuales. No hizo falta cambiar la implementación existente.
- Ciclo 13 (pagina presenta solo lotes disponibles con datos de contexto): rojo confirmado porque la ruta dedicada no existia; se agrego la pagina bajo Inventory y la consulta filtra por status available. La prueba focalizada verde (1 test) verifica filtro y opcion con material, cantidad y ubicacion. Se corrigio el import a la accion de ajustes y se repitio el test.
- Ciclo 14 (listado diferencia los accesos a producto y materia prima por lote): rojo confirmado porque solo existia el enlace generico. Se agregaron ambos accesos con sus rutas; test focalizado verde (1 test).
- Ciclo 15 (pantalla generica solo ofrece productos): rojo confirmado porque consultaba y presentaba materias primas. Se retiro la consulta y el selector de tipo; el formulario envia item_type=product. La prueba focalizada verde (1 test) verifica que solo se consulta products, se ofrece el producto y el tipo oculto es product.
- Ciclo 16 (pantalla generica solo consulta y presenta productos): rojo confirmado porque tambien consultaba materias primas. Se elimino la consulta de raw_materials y el selector de tipo, fijando item_type=product. Test focalizado verde (1 test); la escritura de productos conserva su prueba de accion aprobada.

- Ciclo 17 (recorrido manual de ajuste en localhost y conciliacion en Supabase de desarrollo): completado el 2026-10-28 con datos de prueba desechables. Tras liberar por el flujo existente de Calidad el lote PRUEBASDASDASD, se comprobo que la pantalla inicia con "Seleccionar lote" despues de recargar. Aumentar 1 kg registro entrada vinculada al lote y dejo lote/saldo en 6, promedio, costo del lote y last_cost en 19. Disminuir 1 kg registro salida y dejo lote/saldo en 5, promedio, costo del lote y last_cost en 19. La consulta de Supabase mostro ambos movimientos con saldos 5->6 y 6->5, la misma ubicacion y estado available.
- Hallazgo de revisión: la RPC aceptaba cantidades con precisión mayor a cuatro decimales, aunque los saldos y movimientos persisten cuatro; una cantidad como `0.00001` podía dejar un movimiento redondeado a cero. La migración `20261028010000_validate_raw_material_lot_adjustment_precision.sql` se aplicó en Supabase de desarrollo y la prueba SQL completa se ejecutó sin errores; la nueva aserción confirmó el rechazo de `0.00001` sin escrituras, y el script terminó con `ROLLBACK`.
