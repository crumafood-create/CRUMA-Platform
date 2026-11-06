# Contexto del proyecto

Esta versión de CRUMA trabajará únicamente con la organización CRUMAFOOD y la autorización global vigente.

El objetivo inicial es construir una funcionalidad completa de extremo a extremo que siente las bases de buenas prácticas de arquitectura. Las decisiones de implementación se definirán al trabajar cada historia, sin añadir requisitos no acordados.

## Decisiones acordadas

- Esta versión contempla solo CRUMAFOOD; la gestión de múltiples organizaciones queda pospuesta.
- La operación contempla una sola planta, sin sucursales ni franquicias. No se requiere un flujo de registro o administración de plantas.
- No se crea automáticamente tenant u organización ni se desarrolla un administrador genérico de empresas. Su configuración solo se abordará si un flujo concreto demuestra que necesita esas referencias.
- El administrador inicial es el usuario solicitante mediante la autorización global vigente, respaldada por una asignación explícita en `public.user_roles`.
- Se pospone el correo de contacto y no se agrega una columna para él.
- El esquema de organizaciones del repositorio ya define código y estado activo; no se exige captura manual del código ni se desarrolla un control de desactivación. Esto no implica que exista un registro de organización en la base en uso.
- Invitaciones, planes y organización padre quedan fuera del alcance actual.
- La primera versión funciona solo con conexión. Se prevé soporte sin conexión para una versión futura; su diseño y sincronización aún no se han definido.
- La primera versión utiliza español y pesos mexicanos (MXN).
- Se mantiene el stack existente de CRUMA, sin cambios propuestos. No se ha acordado un stack nuevo ni una arquitectura concreta.

## Trabajo con las historias

### Skills y secuencia de trabajo

Seguir las instrucciones vigentes de los archivos del repositorio, en este orden:

1. [SKILL_backlog](skills/backlog/SKILL_backlog.md): convertir necesidades expresadas por el usuario en historias verticales breves.
2. [SKILL_story](skills/story/SKILL_story.md): refinar una sola historia y obtener aprobación de sus criterios y plan.
3. [SKILL_pair](skills/pair/SKILL_pair.md): implementar la historia aprobada mediante ciclos pequeños de pruebas y código.

Antes de proponer historias o implementación, revisar [ARCHITECTURE.md](ARCHITECTURE.md), el contexto vigente y el código. Consultar los documentos de alineación enlazados cuando afecten al módulo. No reabrir decisiones ya acordadas ni resolver por cuenta propia las ambigüedades de propiedad o dependencias registradas.

### Autorización y continuidad

- Antes de preguntar, revisar las decisiones y autorizaciones explícitas de la conversación, `backlog.md` y `plan.md`. No solicitar otra confirmación para el mismo alcance.
- La aprobación de criterios, plan y lista de pruebas autoriza su ejecución en ciclos pequeños hasta completar el alcance o encontrar un bloqueo real. Si el usuario pide un solo ciclo o una pausa, respetarlo.
- Dividir pasos grandes, corregir fixtures o mocks y ajustar expectativas que contradigan los criterios aprobados son decisiones de ejecución: explicar y continuar sin reabrir la aprobación.
- Consultar cuando falte una decisión de negocio o propiedad, cambien los criterios o el alcance, se requiera debilitar una garantía, o una acción no esté autorizada. Agrupar las preguntas pendientes en una sola consulta breve.
- Mantener separados implementar, hacer commit, publicar y fusionar. Una autorización explícita conserva el alcance y las condiciones indicadas; no pedirla por cada intento o commit dentro de ese mismo trabajo, ni extenderla a otras entregas.

### Cimientos técnicos

Para cada decisión técnica, responder: **¿Qué comportamiento real protege esto y cuál es la solución más pequeña que lo garantiza?** Justificar brevemente las decisiones relevantes en el plan o avance existente; no convertir esta pregunta en otra confirmación al usuario. Consultar solo si falta una regla de negocio o cambia el alcance.

1. **Fuente de verdad:** identificar el módulo propietario y la fuente que determina cada dato afectado. Si hay saldos, costos o estados guardados y derivados, explicar cómo se mantienen coherentes; no crear escrituras competidoras.
2. **Invariantes donde se escribe:** validar permisos y datos en servidor y proteger en base de datos las invariantes que deban mantenerse entre escritores. Usar transacciones y verificar concurrencia cuando varias escrituras deban conservarse juntas; no duplicar reglas sin necesidad demostrada.
3. **Cantidades y dinero explícitos:** identificar unidad, moneda, base del precio, precisión y redondeo donde corresponda. No asumir conversiones ni equivalencias; aclarar su significado de negocio antes de implementar cálculos.
4. **Compatibilidad e historial:** revisar registros antiguos, referencias y operaciones en curso. Versionar cambios de esquema, no inventar valores para datos desconocidos y no modificar migraciones ya aplicadas.
5. **Cierre verificable:** revisar el diff completo, ejecutar pruebas relacionadas y comprobar CI sobre el último commit publicado. Separar evidencia local automatizada, SQL manual, concurrencia y navegador; dejar explícito cualquier chequeo pendiente.

### Código limpio y organizado

- Mantener nombres claros, responsabilidades cohesionadas y dependencias explícitas. Revisar funciones, archivos o módulos largos cuando mezclen responsabilidades, repitan lógica o dificulten comprender y probar el flujo; no imponer un límite de líneas como criterio único.
- Refactorizar esos casos dentro del recorrido revisado, sin pedir otra autorización por cada extracción o movimiento que preserve el comportamiento y las fronteras existentes. Separar la refactorización de cambios funcionales y mantener las pruebas en verde.
- Extraer funciones o componentes y reubicar implementación en su capa propietaria según `ARCHITECTURE.md`, actualizando consumidores, imports y pruebas. Conservar contratos públicos y puntos de entrada del framework; consultar si el movimiento cambia propiedad, dependencias permitidas o contratos consumidos.
- No fragmentar código solo para reducir líneas ni crear capas, carpetas, wrappers o abstracciones sin consumidores reales. Documentar brevemente qué responsabilidad se separó y verificar el recorrido afectado.

### Backlog

- No inventar requisitos. Preguntar una cosa a la vez, con una sugerencia, cuando falte información.
- Proponer como máximo 10–15 historias, de una línea cada una, con actor, acción y beneficio. La primera debe ser la mínima utilizable de extremo a extremo.
- No dividir por capas ni proponer historias técnicas. Añadir `Requiere: #N` solo para dependencias indispensables.
- Mantener la historia en una línea, sin criterios de aceptación, detalles técnicos ni estimaciones. Registrar prioridad, motivo y dependencias como metadatos separados.
- Antes de añadir o priorizar una historia futura, aclarar actor, tarea real, solución actual y consecuencia de posponerla cuando esos datos falten. Usar ejemplos reales y reutilizar respuestas; proponer historia y prioridad para una sola aprobación antes de escribirlas en `pendientes.md`.
- Priorizar con evidencia: P1 bloquea la próxima operación acordada o corrige un riesgo demostrado de datos o acceso; P2 es necesaria para ese recorrido con una alternativa temporal aceptable; P3 es una mejora con consumidor confirmado que puede esperar. No inventar urgencia ni activar una historia al registrarla.
- Toda propuesta que requiera un módulo, carpeta superior o campo nuevo necesita un consumidor real identificado; consultar antes de incorporarla si la arquitectura no lo justifica.
- `backlog.md` contiene las historias activas de la conversación actual. Las historias anteriores que el usuario quiera retomar después se conservan en `pendientes.md`; no duplicarlas en ambos archivos. Este archivo guarda contexto y decisiones.

### Story

- Contrastar las funciones y pasos del recorrido con el negocio real: quién los usa, cuándo, qué ocurre antes y después y qué consecuencia tendría retirarlos. Preguntar solo por usos no confirmados; la existencia de código no demuestra una necesidad de negocio.
- Revisar una historia del backlog y declarar explícitamente su módulo propietario según el catálogo de arquitectura. Si no está definido o resulta ambiguo, consultar al usuario.
- Proponer 2–3 criterios en formato Dado/Cuando/Entonces que describan resultados observables. Si requiere más, proponer dividir la historia.
- Preparar un plan de hasta cinco puntos y explicitar lo que queda fuera del alcance. No escribir código en esta etapa.
- Ningún campo, columna, carpeta o módulo entra al plan sin un criterio aprobado o una pantalla o flujo existente que lo consuma realmente.
- Señalar conflictos con la dirección de dependencias y obtener aprobación del plan antes de implementar. Sugerir patrones solo con evidencia concreta en el código.

### Pair

- Verificar la historia, su módulo propietario, criterios, plan y lista de pruebas; reutilizar lo ya aprobado. Proponer únicamente lo que falte.
- Revisar el recorrido afectado y sus productores y consumidores: contratos, funciones, acciones, consultas, RPC, vistas, triggers y pantallas pertinentes. Comprobar permisos, validación, integridad, transacciones, concurrencia, unidades, costos y errores según el caso, sin auditar todo el repositorio.
- Resolver los defectos que impidan cumplir un criterio aprobado; consultar si exigen cambiar una regla o el alcance. Proponer mejoras independientes para refinamiento mediante `/backlog`, sin incorporarlas automáticamente a la historia ni a `pendientes.md`.
- Completar secuencialmente los ciclos aprobados, con avances breves y sin solicitar confirmación al terminar cada uno. Mantener una pausa solicitada por el usuario.
- Probar comportamiento por interfaces públicas; derivar expectativas de los criterios. No reordenar ni modificar producción únicamente para satisfacer expectativas sobre su estructura interna.
- Si una prueba confunde una lectura con una escritura, exige un orden irrelevante o contiene un fixture incorrecto, corregir la prueba con evidencia y conservar su garantía. No omitirla, borrarla ni debilitarla para obtener verde.
- Usar unas 50 líneas o tres archivos como señal para dividir el trabajo en pasos revisables; dividir dentro del alcance aprobado sin pedir otra autorización. Tras dos intentos fallidos, revisar el diagnóstico; detenerse si el bloqueo sigue sin explicación o exige una decisión nueva.
- Mantener separados los refactors y la funcionalidad. La limpieza y separación de responsabilidades dentro del recorrido revisado está autorizada por la regla de código limpio; consultar antes de ampliar el trabajo a otros recorridos o cambiar fronteras y contratos.
- Eliminar código sin uso comprobado o redundante sin efecto observable dentro del recorrido revisado, en un paso separado y verificable, sin pedir aprobación por cada eliminación. Comprobar consumidores estáticos, puntos de entrada dinámicos, llamadas externas y efectos secundarios pertinentes; una búsqueda sin resultados no basta. Si su uso o efecto es incierto, preguntar antes de retirarlo. No debilitar garantías ni borrar migraciones históricas o datos bajo esta regla.
- Registrar pruebas ejecutadas y verificaciones manuales pendientes. La falta de Docker o navegador no impide completar el trabajo independiente; no declarar una prueba ejecutada ni la historia terminada sin evidencia.
- No hacer commits, publicar ni fusionar salvo autorización explícita del usuario para esa acción. Cuando falte, preparar primero el cambio verificable y pedir una sola autorización concreta.
- Señalar cambios necesarios en `ARCHITECTURE.md` si afectan fronteras o dependencias; no editarlo sin autorización.

### Decisiones anteriores de formulario, pospuestas

El formulario general de alta trabajado previamente, con código editable, correo obligatorio, selector de tenant y control de desactivación, no representa el alcance de esta versión. Por indicación del usuario se eliminaron sus componentes, contratos, validación de contexto y pruebas específicas, al no tener un consumidor real. Los contratos de otros módulos se conservan.

Para trabajo nuevo, aplicar `ARCHITECTURE.md`: no crear archivos, funciones, campos o columnas sin un consumidor real identificado. La existencia de un esquema previsto no justifica implementar una administración genérica.

### Referencia de autorización para la historia pospuesta

La equivalencia acordada para la historia pospuesta de creación de organizaciones era: el `admin` global con una asignación explícita en `public.user_roles` representa al Superadministrador. Esa aprobación no reactiva la historia ni autoriza nuevas funciones. No se crea un rol efectivo `superadmin`.

Tenant sigue siendo la frontera técnica y organización la entidad de negocio según ADR-0017. La asociación concreta de CRUMAFOOD debe verificarse; no se deben inventar su tenant, ID ni código. El selector general de tenant queda pospuesto con el formulario anterior.

Las membresías, `profiles.role` y los datos del formulario no conceden permisos. Esta equivalencia no activa la autorización por organización pendiente del ADR-0017 ni se extiende a otras historias.

El backlog inicial fue validado en la conversación. Por indicación del usuario, las historias activas se guardan en `backlog.md` con casillas para registrar su avance; las anteriores que se retomarán después se conservan en `pendientes.md` y no se duplican en ambos archivos.

La historia de alta de organización queda pospuesta hasta identificar un flujo que la necesite. No se sustituye por un alta de planta. Según las consultas ejecutadas por el usuario en Supabase, `public.tenants` existe sin registros y `public.organizations` no existe; no se han creado registros ni aplicado migraciones durante este trabajo.

