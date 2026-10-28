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

### Backlog

- No inventar requisitos. Preguntar una cosa a la vez, con una sugerencia, cuando falte información.
- Proponer como máximo 10–15 historias, de una línea cada una, con actor, acción y beneficio. La primera debe ser la mínima utilizable de extremo a extremo.
- No dividir por capas ni proponer historias técnicas. Añadir `Requiere: #N` solo para dependencias indispensables.
- No incluir criterios de aceptación, detalles técnicos, estimaciones ni prioridades en las historias.
- Toda propuesta que requiera un módulo, carpeta superior o campo nuevo necesita un consumidor real identificado; consultar antes de incorporarla si la arquitectura no lo justifica.
- `backlog.md` contiene las historias activas de la conversación actual. Las historias anteriores que el usuario quiera retomar después se conservan en `pendientes.md`; no duplicarlas en ambos archivos. Este archivo guarda contexto y decisiones.

### Story

- Revisar una historia del backlog y declarar explícitamente su módulo propietario según el catálogo de arquitectura. Si no está definido o resulta ambiguo, consultar al usuario.
- Proponer 2–3 criterios en formato Dado/Cuando/Entonces que describan resultados observables. Si requiere más, proponer dividir la historia.
- Preparar un plan de hasta cinco puntos y explicitar lo que queda fuera del alcance. No escribir código en esta etapa.
- Ningún campo, columna, carpeta o módulo entra al plan sin un criterio aprobado o una pantalla o flujo existente que lo consuma realmente.
- Señalar conflictos con la dirección de dependencias y obtener aprobación del plan antes de implementar. Sugerir patrones solo con evidencia concreta en el código.

### Pair

- Verificar que la historia, su módulo propietario y el plan aprobado encajen con el código y la arquitectura actual.
- Proponer los nombres de las pruebas y su capa responsable; marcar la verificación manual y obtener aprobación de la lista antes de escribirlas.
- Por defecto realizar un ciclo y detenerse para revisión: una prueba que falla, código mínimo y pruebas que pasan. Si el usuario pide N ciclos, completarlos secuencialmente.
- Probar comportamiento por interfaces públicas; las expectativas derivan de los criterios, no de la lógica de implementación.
- Detenerse ante decisiones no aprobadas, ampliación de alcance, dependencias o propiedad sin resolver, nuevos elementos sin consumidor justificado, necesidad de cambiar pruebas para pasar, dos intentos sin llegar a verde o pasos de más de unas 50 líneas o tres archivos. En este último caso proponer dividir el paso.
- Mantener separados los refactors y las nuevas funcionalidades. Refactorizar con pruebas en verde y aprobación del usuario; verificar juntos los criterios manuales y sugerir `/code-review` al finalizar.
- No hacer commits. Proponer un mensaje cuando exista una unidad verificable; el usuario realiza el commit.
- Proponer documentar decisiones globales; señalar los cambios necesarios en `ARCHITECTURE.md` si afectan fronteras o dependencias y no editar ese documento sin autorización.

### Decisiones anteriores de formulario, pospuestas

El formulario general de alta trabajado previamente, con código editable, correo obligatorio, selector de tenant y control de desactivación, no representa el alcance de esta versión. Por indicación del usuario se eliminaron sus componentes, contratos, validación de contexto y pruebas específicas, al no tener un consumidor real. Los contratos de otros módulos se conservan.

Para trabajo nuevo, aplicar `ARCHITECTURE.md`: no crear archivos, funciones, campos o columnas sin un consumidor real identificado. La existencia de un esquema previsto no justifica implementar una administración genérica.

### Referencia de autorización para la historia pospuesta

La equivalencia acordada para la historia pospuesta de creación de organizaciones era: el `admin` global con una asignación explícita en `public.user_roles` representa al Superadministrador. Esa aprobación no reactiva la historia ni autoriza nuevas funciones. No se crea un rol efectivo `superadmin`.

Tenant sigue siendo la frontera técnica y organización la entidad de negocio según ADR-0017. La asociación concreta de CRUMAFOOD debe verificarse; no se deben inventar su tenant, ID ni código. El selector general de tenant queda pospuesto con el formulario anterior.

Las membresías, `profiles.role` y los datos del formulario no conceden permisos. Esta equivalencia no activa la autorización por organización pendiente del ADR-0017 ni se extiende a otras historias.

El backlog inicial fue validado en la conversación. Por indicación del usuario, las historias activas se guardan en `backlog.md` con casillas para registrar su avance; las anteriores que se retomarán después se conservan en `pendientes.md` y no se duplican en ambos archivos.

La historia de alta de organización queda pospuesta hasta identificar un flujo que la necesite. No se sustituye por un alta de planta. Según las consultas ejecutadas por el usuario en Supabase, `public.tenants` existe sin registros y `public.organizations` no existe; no se han creado registros ni aplicado migraciones durante este trabajo.
