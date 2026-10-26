# Registrar productos

Estado: historia implementada, verificada y commiteada en su rama; los tres criterios funcionales y las comprobaciones finales están completos, con las advertencias de compilación registradas en Avance. Documento temporal de esta historia; se descartará al pasar a la siguiente, según indicación del usuario.

## Historia

Como administrador autorizado, quiero registrar productos con datos y estados válidos para utilizarlos en el catálogo.

## Módulo propietario

**Catalog** es el propietario lógico según [ARCHITECTURE.md](ARCHITECTURE.md) y la [matriz ERP/MES/WMS](docs/product/erp-mes-wms-reconciliation.md#4-fronteras-que-requieren-conciliación). El formulario vive en Catalog y los contratos y repositorios actuales en Inventory. Su transición sigue pendiente; esta historia no autoriza moverlos ni duplicar el maestro de productos.

## Contexto

Se trabaja sobre el alta existente de productos para CRUMAFOOD, con una sola planta y la autorización global vigente. La auditoría identificó diferencias entre los estados aceptados por la aplicación y SQL, y entre el stock mínimo decimal aceptado por el contrato y su columna entera. Las pruebas previas aceptaban esos valores; los ajustes y las verificaciones posteriores se detallan en Avance.

## Criterios de aceptación aprobados

- [x] Dado un administrador autorizado y datos válidos, con estado Activo, Borrador o Archivado, stock mínimo entero mayor o igual a cero y código interno opcional, cuando registra un producto, entonces queda guardado y aparece en el catálogo administrativo con esos valores.
- [x] Dados datos obligatorios incompletos, valores fuera de las reglas acordadas o un slug ya registrado, cuando intenta guardar, entonces el alta se rechaza con un motivo comprensible y no se crea un producto adicional.
- [x] Dado un usuario sin sesión o sin autorización administrativa efectiva, cuando intenta registrar un producto, entonces la operación se rechaza y no se crea ningún registro.

## Plan aprobado

- Reutilizar el alta existente y los campos que ya tienen consumidores, sin agregar campos ni columnas por anticipación.
- Alinear las opciones del formulario, la validación del servidor y la persistencia con los estados, cantidades y obligatoriedad que se acuerden.
- Mantener la autorización global vigente y verificar la protección de la escritura en la base de datos.
- Conservar las garantías de integridad y unicidad y traducir los rechazos a mensajes comprensibles para el usuario.
- Verificar el recorrido de registro, consulta posterior y rechazo, incluidas solicitudes simultáneas con el mismo slug.

## Fuera de alcance

- Edición, eliminación, publicación comercial y rediseño general del catálogo.
- Alta de materias primas, recetas y órdenes de producción; se trabajan en historias posteriores.
- Crear tenant, organización, planta o permisos por organización.
- Trasladar módulos, hacer refactors de inventario o añadir infraestructura para usos futuros.

## Reglas aprobadas

- Estados permitidos: Activo (`active`), Borrador (`draft`) y Archivado (`archived`), compatibles con la restricción SQL vigente. `inactive` deja de ser un estado válido.
- Stock mínimo: entero mayor o igual a cero. Se rechazan decimales, negativos y valores no finitos, sin ampliar el tipo de la columna.
- Código interno: opcional. Si se omite o queda vacío, el contrato conserva su tratamiento actual como `null`; si se proporciona, permanece la unicidad ya existente en SQL.

## Lista de pruebas aprobada

| Prueba | Capa responsable |
|---|---|
| Acepta Activo, Borrador y Archivado; rechaza Inactivo y estados desconocidos | Contrato del servidor |
| Acepta stock mínimo entero no negativo; rechaza decimales, negativos y valores no finitos | Contrato del servidor |
| Permite omitir el código interno y conserva el valor cuando se proporciona | Formulario y contrato del servidor |
| Muestra los estados acordados y exige nombre y slug | Formulario |
| Rechaza campos obligatorios incompletos y relaciones de clasificación inválidas | Servidor |
| Guarda el producto y permite consultar sus valores persistidos | Acción del servidor y PostgreSQL |
| Rechaza slug o código interno proporcionado repetidos con un motivo comprensible, incluso ante concurrencia | Acción del servidor y PostgreSQL |
| Rechaza la creación sin sesión o sin admin explícito en user_roles | Acción del servidor y RLS en PostgreSQL |

Verificación manual: presentación, confirmación o redirección al catálogo y mensajes de rechazo en el navegador.

## Avance

- Completado el ciclo de estados en el contrato del servidor: acepta `active`, `draft` y `archived`; rechaza `inactive` y estados desconocidos. Se comprobaron dos fallos iniciales y después pasaron las 16 pruebas del contrato. Las opciones del formulario se verificaron en su ciclo correspondiente.
- Completado el ciclo de stock mínimo en el contrato del servidor: acepta enteros no negativos y rechaza decimales, negativos y valores no finitos. Se comprobaron los fallos iniciales y después pasaron las 23 pruebas del contrato. No se cambió el tipo de la columna.
- Completado el ciclo de código interno opcional: el formulario permite dejarlo vacío; el contrato conserva `null` si se omite o contiene solo espacios y conserva el código proporcionado sin espacios en los extremos. Se comprobó el fallo inicial del formulario y después pasaron 24 pruebas entre formulario y contrato. No se modificó la unicidad existente en SQL.
- Completado el ciclo de opciones y campos obligatorios del formulario: ofrece Activo, Borrador y Archivado, con Activo por defecto; nombre y slug siguen siendo obligatorios. La prueba verifica campos vacíos y los valores de los tres estados enviados al contrato. Se comprobó el fallo inicial y después pasaron 25 pruebas entre formulario y contrato.
- Verificado el rechazo en la acción real `createProduct` antes del INSERT: nombre y slug omitidos, vacíos o con solo espacios; categoría/familia incompletas; y familia de otra categoría. La prueba pasó con la implementación existente, sin cambios de producción. Pasaron 36 pruebas de acción, formulario, contrato y repositorio; la consulta se simuló y no demuestra ejecución contra PostgreSQL.
- Verificado el envío al guardado en la acción real `createProduct`: se envían nombre y slug normalizados, estado Archivado, stock mínimo entero y código interno `null`; después se invalida `/products` y se redirige al catálogo. La prueba pasó con la implementación existente, con 37 pruebas en verde. El guardado se simuló; este paso no acredita persistencia real.
- El usuario trabaja con Supabase, Vercel y GitHub en la nube, sin Docker local; no se instala ni se inicia Docker en su equipo. Ejecuta las comprobaciones remotas y comparte sus resultados; el agente no ejecuta consultas en su proyecto. Las pruebas SQL acreditan inserción y consulta en PostgreSQL real de productos Activo, Borrador y Archivado, stock cero o 12 y código interno NULL o proporcionado, con los datos de prueba retirados al finalizar. Sigue pendiente el recorrido completo desde el formulario hasta el catálogo en navegador.
- Completado el ciclo de consulta y presentación del stock mínimo: el catálogo administrativo selecciona `min_stock` y lo muestra por producto, incluido cero. Se comprobó el fallo inicial y después pasaron 38 pruebas de página, acción, formulario, contrato y repositorio. La consulta se simuló; PostgreSQL real sigue pendiente.
- Completado el ciclo de traducción de errores de guardado en `createProduct`: el error SQL `23505` identifica las restricciones de slug y código interno y devuelve mensajes comprensibles; los demás errores devuelven un mensaje genérico. Los detalles internos se conservan en `cause`; un rechazo no invalida el catálogo ni redirige. Se comprobó el fallo inicial y después pasaron 39 pruebas. No se modificaron las restricciones SQL; la prueba simuló los errores y no acredita concurrencia real.
- La presentación de mensajes se divide en tres ciclos: respuesta serializable del servidor, presentación y conservación de datos en el formulario, y conexión del alta con verificación del recorrido.
- Completado el ciclo de respuesta del servidor: `createProductForForm` reutiliza `createProduct` y devuelve solo `{ error: mensaje }` para errores de guardado controlados. No devuelve la causa técnica ni intercepta errores de autorización o señales de redirección. Se comprobó el fallo inicial y después pasaron 40 pruebas; los errores de base se simularon.
- Completado el ciclo de presentación y conservación de datos: `ProductForm` acepta el resultado serializable, muestra el rechazo en una alerta con `FormError` y evita el restablecimiento automático de los campos al fallar. La prueba verifica ambos mensajes y conserva nombre, slug, código, descripción, stock, estado y unidad. Se comprobó el fallo inicial y después pasaron 41 pruebas; la acción se simuló en la prueba del formulario.
- Completado el ciclo de conexión del alta: la página usa `createProductForForm`. La prueba integra página, formulario, acción, contrato y repositorio reales; un slug duplicado muestra el mensaje y conserva los datos sin invalidar el catálogo ni redirigir. Se comprobó el fallo inicial y después pasaron 42 pruebas, TypeScript y ESLint. Supabase y la autorización se simularon; no acredita persistencia real ni una sesión de navegador.
- Verificado el rechazo sin sesión o sin admin explícito en `user_roles`: la prueba ejecuta `createProduct` y `createProductForForm` con los guards y la consulta de roles reales, simulando el cliente Supabase. Ambas acciones rechazan la sesión ausente, la ausencia de roles y el rol `customer`; los metadatos y el campo `role` del formulario no conceden acceso. No se intenta insertar, invalidar ni redirigir; la consulta de roles corresponde al usuario autenticado. La prueba pasó con la implementación existente, sin cambios de producción; no acredita ejecución de RLS en PostgreSQL.
- Los tres criterios funcionales están verificados con el alcance descrito: alta y catálogo, redirección automática, rechazos y conservación de datos para slug y código interno duplicados, validaciones del servidor, autorización, persistencia y RLS en PostgreSQL, y unicidad del slug ante concurrencia. La comprobación manual se apoya en los resultados informados por el usuario; el agente no operó el navegador. Las comprobaciones locales de cierre pasaron y la historia #1 se marcó completada en `backlog.md`.
- Verificación RLS en la nube: el flujo `database` de `.github/workflows/ci.yml` ya prepara Supabase en GitHub Actions y ejecuta `db:verify`, que incluye las pruebas SQL de seguridad. Esa configuración no acredita el estado del proyecto alojado; este se comprobó mediante el diagnóstico y la prueba de comportamiento ejecutados por el usuario en Supabase. El agente no ha ejecutado consultas remotas.
- El usuario compartió el diagnóstico de Supabase alojado: `products` tiene RLS activa; `public_read_products` solo concede SELECT de activos no eliminados y `admin_all_products` exige `is_admin(auth.uid())` para escritura. `is_admin` consulta exclusivamente la fila `admin` en `public.user_roles`, es SECURITY DEFINER y fija `search_path` vacío. Los grants de tabla incluyen escritura para `anon` y `authenticated`; RLS continúa restringiendo las filas. Este diagnóstico aún no demuestra el comportamiento del INSERT.
- Verificada `supabase/tests/database/product_creation_rls.sql` en Supabase alojado según el resultado compartido por el usuario: `sin_sesion = rechazado`, `sin_admin = rechazado`, `admin = permitido_y_revertido`. El bloque cambia al rol de cada caso, exige rechazo por RLS para `anon` y una identidad SQL sin roles, e inserción y consulta para un admin existente en `user_roles`; termina en ROLLBACK. No crea usuarios ni modifica sus roles. Junto con las pruebas de ambas acciones, completa el criterio de rechazo sin autorización; no acredita todavía el recorrido completo desde el navegador.
- Verificada `supabase/tests/database/product_creation_uniqueness.sql` en Supabase alojado según el resultado compartido por el usuario: `slug_duplicado = rechazado`, `codigo_interno_duplicado = rechazado`, `datos_prueba = revertidos`. Como admin existente, el bloque intenta duplicar cada campo por separado, exige SQLSTATE `23505` y la restricción correspondiente (`products_slug_key` o `products_internal_code_key`), comprueba que no quede otra fila ni cambie el original y termina con ROLLBACK. La prueba secuencial pasó y se complementó con la prueba concurrente del slug descrita a continuación. No se modificaron restricciones ni código de producción.
- Verificados `supabase/tests/database/product_slug_concurrency_a.sql` y `product_slug_concurrency_b.sql` en Supabase alojado según ambos resultados compartidos por el usuario: A devolvió `concurrencia = comprobada`; B devolvió `slug_duplicado = rechazado` y `filas_restantes = 0`. Los INSERT se ejecutaron como `authenticated` con un admin explícito existente. A observó B bloqueada por su conexión mediante `pg_blocking_pids` antes de confirmar; B exigió `23505` por `products_slug_key`, revirtió su intento, comprobó un único ganador y lo eliminó por ID y slug exactos. Queda acreditada la unicidad del slug ante solicitudes solapadas y la limpieza de los datos de prueba. No se modificó código de producción ni se instalaron extensiones. Para el código interno se verificó el rechazo secuencial; no se ejecutó una prueba concurrente de ese campo.
- Verificada `supabase/tests/database/product_creation_persistence.sql` en Supabase alojado según el resultado compartido por el usuario: `activo = guardado_y_consultado`, `archivado = guardado_y_consultado`, `stock_minimo = 12`, `datos_prueba = revertidos`. Como `authenticated` con un admin explícito existente, guarda y consulta ambos estados con stock 12; conserva código interno NULL en Activo y proporcionado en Archivado. El INSERT omite el ID, recupera el generado y un SELECT posterior comprueba nombre, slug, código, estado y stock contra los valores esperados. El bloque terminó en ROLLBACK. No acredita todavía el recorrido desde el formulario ni la visualización real en el catálogo. No se modificaron columnas ni código de producción.
- Verificación manual informada por el usuario en `http://localhost:3000`: confirmó crear un producto y compartió el listado de `/products`, donde aparece `Tequeños de Choco party para freir`, código `PT-TEQ-CHOC-PARTY`, slug `tequenos-de-choco-party-para-freir`, estado `active`, stock mínimo 20, categoría Tequeños, familia Party, sabor Chocolate y preparación Crudo. Confirmó después que al guardar la aplicación abrió automáticamente `/products`. Se acreditan el guardado desde el formulario, la redirección y la consulta en catálogo con esos valores. El agente no observó ni operó ese navegador: Computer Use detuvo el acceso a Brave al no poder determinar con confianza su URL. No se eliminaron productos del usuario.

- Verificación manual de rechazo de slug duplicado: el usuario informó que el formulario muestra exactamente `Ya existe un producto con ese slug.` después del intento con `tequenos-de-choco-party-para-freir`. Confirmó después que se conservaron los datos del formulario, ante la pregunta por nombre, slug, unidad, estado Borrador y stock mínimo 12. Quedan verificados el mensaje y la conservación de los datos en el recorrido real de ese rechazo.

- Verificación manual de código interno duplicado: el usuario informó el mensaje exacto `Ya existe un producto con ese código interno.` y confirmó la conservación de los datos, tras la prueba propuesta con código `PT-TEQ-CHOC-PARTY` y slug diferente `prueba-codigo-interno-duplicado-01`. Junto con la prueba de slug, quedan comprobados ambos mensajes en el formulario real y la conservación de lo capturado.
- Comprobaciones finales locales: pasaron las 43 pruebas de productos con `--maxWorkers=1`, TypeScript y ESLint de los archivos de la historia. La primera ejecución de pruebas con dos workers, simultánea a otros controles, terminó con 41 casos correctos y dos timeouts de 5000 ms; la repetición secuencial pasó con el mismo límite y las mismas expectativas, sin cambiar pruebas ni producción. Entorno local Node 24.21.0; `.nvmrc` fija 24.18.0 para el entorno reproducible.
- Build de producción completado con Next.js 15.5.19 y salida 0, incluidas las 246 páginas, validación de tipos y trazas de compilación. Se ejecutó en una copia temporal del árbol de trabajo para evitar interferir con el servidor activo del puerto 3000; la copia y su enlace de dependencias se retiraron, conservando las dependencias originales. Se emitieron advertencias de serialización de caché de Webpack y uso de `process.version` de Supabase en el runtime Edge, con traza hacia `src/infrastructure/integrations/supabase/middleware.ts`; ese archivo y las versiones de dependencias no se modificaron en esta historia. La advertencia de compatibilidad queda señalada para revisión, sin ampliar el alcance. Este build no despliega cambios en Vercel ni sustituye las comprobaciones manuales informadas por el usuario.

El usuario autorizó actualizar las expectativas antiguas que aceptan `inactive`, rechazan `archived` y esperan stock `12.5`, como parte de los ciclos correspondientes. No se omiten pruebas.

El flujo de implementación seguirá el [SKILL_pair indicado por el usuario](../../../../../Downloads/files/SKILL_pair.md): lista de pruebas aprobada y un ciclo por vez salvo petición de un lote. El refinamiento sigue [SKILL_story](skills/story/SKILL_story.md).
