# ADR-0001: Adoptar Tenant técnico con aislamiento lógico por fila

> **Propuesta:** usar un Tenant técnico como frontera de aislamiento, `tenant_id` como clave canónica y PostgreSQL RLS como control obligatorio dentro de un esquema compartido.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-07-12 |
| Decisores | Product Owner, responsable de arquitectura, responsable de datos y responsable de seguridad |
| Consultados | Responsables de Identity & Access, Business Core, operación, Mobile y Desktop |
| Informados | Desarrollo, calidad, soporte y responsables de módulos |
| Propietario | Identity & Access con corresponsabilidad de Datos y Seguridad |
| Alcance | Identidad, organizaciones, tablas scoped, RLS, APIs, caché, Storage, Realtime, jobs, auditoría y migración |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; se requiere spike de esquema y RLS antes de aceptación |
| Issues relacionados | Pendiente de vincular al backlog de Identity, baseline SQL y RLS |

---

## 1. Resumen ejecutivo

CRUMAFOOD necesita separar datos y autoridad entre organizaciones antes de declarar multi-tenancy productivo.

El repositorio contiene intención de `tenants` y `tenant_id`, pero no existe un baseline SQL versionado que demuestre aislamiento completo. También existe evidencia previa de tablas con RLS habilitada sin políticas adecuadas, lo que produjo respuestas vacías o errores de permiso.

La decisión propuesta es:

> **CRUMAFOOD modela Tenant como frontera técnica de aislamiento, conserva Organización como entidad del negocio, utiliza `tenant_id UUID NOT NULL` en toda fila scoped y aplica aislamiento lógico mediante PostgreSQL RLS en un esquema compartido.**

Inicialmente cada tenant expondrá una organización principal. El modelo podrá admitir más de una organización en el futuro sin convertir Organización en la clave técnica de aislamiento.

---

## 2. Contexto

La plataforma usa Next.js, Supabase Auth y PostgreSQL/Supabase.

Los documentos vigentes establecen:

- PostgreSQL como autoridad transaccional;
- RLS como defensa de datos;
- autorización explícita en casos de uso;
- migraciones versionadas;
- y separación entre identidad, roles, permisos y contexto organizacional.

`database-map.md` propone:

- una tabla `tenants`;
- `tenant_id` en usuarios y entidades de negocio;
- y relaciones de un tenant con productos, proveedores, órdenes, clientes, alertas y actividad.

Esa representación es intención, no evidencia del esquema desplegado.

---

## 3. Problema

CRUMAFOOD debe elegir una frontera y una clave de aislamiento antes de:

- migrar tablas;
- diseñar membresías;
- completar RLS;
- normalizar autorización;
- construir onboarding;
- separar cachés;
- habilitar integraciones por cliente;
- y operar más de una organización.

Sin una decisión canónica, cada módulo puede:

- usar un nombre distinto;
- filtrar de forma incompleta;
- crear relaciones cross-tenant;
- confundir organización con seguridad;
- o depender excesivamente de service role.

---

## 4. Alcance

Esta decisión cubre:

- significado de Tenant;
- relación conceptual con Organización;
- clave física canónica;
- topología inicial de aislamiento;
- reglas para tablas scoped;
- RLS;
- relaciones;
- service role;
- migración;
- y criterios para aislamiento dedicado futuro.

Esta decisión no cubre:

- planes comerciales;
- facturación SaaS;
- dominios personalizados;
- impersonation;
- residencia definitiva;
- múltiples organizaciones visibles por tenant;
- ni diseño completo de roles y permisos.

Estas decisiones tendrán ADR propios cuando sean necesarias.

---

## 5. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Aislamiento de datos | Alta | Una consulta o error de código no debe exponer otro tenant |
| Integridad referencial | Alta | Las FKs deben impedir cruces incluso con IDs válidos |
| Simplicidad inicial | Alta | El equipo no debe operar una base por cliente sin necesidad |
| Compatibilidad con Supabase | Alta | Auth, RLS, Storage y Realtime deben integrarse naturalmente |
| Evolución | Alta | El modelo debe permitir aislamiento dedicado futuro |
| Rendimiento | Alta | Los filtros y policies deben ser indexables |
| Operación | Alta | Migraciones, backups y observabilidad deben ser administrables |
| Costo | Media | La topología inicial debe evitar infraestructura por tenant |
| Portabilidad | Media | La semántica no debe depender solo de claims propietarios |
| Time-to-market | Media | El onboarding inicial debe ser incremental |

---

## 6. Restricciones

La decisión deberá respetar:

- PostgreSQL/Supabase como autoridad actual;
- RLS para acceso cliente;
- mínimo privilegio;
- Business Core independiente del proveedor;
- migraciones versionadas;
- compatibilidad con datos existentes;
- operación serverless en Vercel;
- clientes Web, Mobile y Desktop;
- y un equipo que aún no opera infraestructura dedicada por cliente.

No se puede asumir que el esquema actual coincide con `database-map.md`.

---

## 7. Supuestos

Esta propuesta asume que:

- CRUMAFOOD está en una etapa donde un esquema compartido es operable;
- no existe hoy una obligación contractual de base dedicada por cliente;
- los tenants iniciales comparten región y modelo de datos;
- una organización principal por tenant cubre el primer rollout;
- PostgreSQL puede sostener el volumen esperado con índices por tenant;
- y el esquema desplegado puede migrarse por fases.

Cada supuesto deberá verificarse antes de Aceptado.

---

## 8. Criterios de decisión

| Criterio | Prioridad | Cómo se evalúa |
|---|---|---|
| Aislamiento verificable | Crítica | RLS, constraints y pruebas A/B |
| Integridad | Crítica | FKs compuestas y transacciones |
| Operabilidad | Alta | Migración, backup, soporte y monitoreo |
| Simplicidad | Alta | Componentes y procesos adicionales |
| Costo | Alta | Recursos fijos y costo por tenant |
| Escalabilidad | Alta | Índices, cuotas y noisy neighbor |
| Portabilidad | Media | Dependencia de Supabase y salida |
| Residencia | Media actual | Capacidad de evolucionar a dedicado |

---

## 9. Opciones consideradas

| Opción | Resumen | Resultado propuesto |
|---|---|---|
| A | Esquema compartido, `tenant_id` y RLS | Elegida |
| B | Esquema compartido, `organization_id` y RLS | No elegida |
| C | Schema PostgreSQL por tenant | No elegida |
| D | Proyecto o base por tenant | No elegida inicialmente |
| E | Mantener filtros ad hoc actuales | Rechazada |

---

## 10. Opción A — Esquema compartido con Tenant técnico

### Descripción

Todas las entidades scoped viven en un esquema compartido e incluyen `tenant_id UUID NOT NULL`.

Tenant representa seguridad y operación. Organización representa estructura del negocio.

RLS deriva el tenant permitido desde identidad y membresía confiables.

### Ventajas

- separación conceptual clara;
- una evolución de esquema;
- compatibilidad natural con PostgreSQL RLS;
- onboarding de bajo costo;
- índices y constraints explícitos;
- operación centralizada;
- y posibilidad de mover un tenant a infraestructura dedicada posteriormente.

### Desventajas

- cualquier omisión de scope es peligrosa;
- RLS y FKs requieren disciplina;
- backups compartidos complican restauración individual;
- noisy neighbor debe controlarse;
- y las migraciones afectan a todos los tenants.

### Riesgos

- policies incompletas;
- claves de caché sin tenant;
- service role demasiado amplia;
- consultas lentas por policies;
- y referencias cruzadas sin constraints compuestas.

### Costo y operación

Requiere baseline, migración de tablas, membresías, policies, pruebas y monitoreo.

No requiere una infraestructura independiente por tenant en la etapa inicial.

---

## 11. Opción B — Organización como frontera física

### Descripción

Cada fila usa `organization_id` y Organización actúa simultáneamente como entidad comercial y frontera de seguridad.

### Ventajas

- lenguaje cercano al usuario;
- menos entidades conceptuales;
- y una clave directa en datos de negocio.

### Desventajas

- mezcla estructura comercial con aislamiento técnico;
- dificulta que un tenant contenga varias organizaciones;
- hace más costosa una reorganización empresarial;
- y puede confundir scopes inferiores con la frontera principal.

### Riesgos

- cambios de estructura convertidos en migraciones de seguridad;
- integraciones o suscripciones asociadas a la entidad equivocada;
- y dificultad para ofrecer aislamiento dedicado sin redefinir identidad.

### Resultado

No se elige porque Tenant y Organización tienen ciclos y responsabilidades diferentes.

---

## 12. Opción C — Schema por tenant

### Descripción

Cada tenant tiene un schema PostgreSQL con tablas equivalentes.

### Ventajas

- separación de nombres;
- exportación por schema;
- y menor riesgo de consultas ordinarias cross-tenant.

### Desventajas

- migraciones N veces;
- complejidad con Supabase APIs y tooling;
- mayor costo de conexión y mantenimiento;
- reporting cross-tenant difícil;
- y deriva de esquema.

### Riesgos

- tenants con versiones distintas;
- fallos parciales de migración;
- y operación compleja para un equipo pequeño.

### Resultado

No se elige para la etapa inicial.

---

## 13. Opción D — Proyecto o base por tenant

### Descripción

Cada tenant obtiene proyecto Supabase o base de datos propia.

### Ventajas

- aislamiento fuerte;
- backup y residencia independientes;
- límites de capacidad separados;
- y blast radius reducido.

### Desventajas

- costo fijo por tenant;
- provisioning;
- migraciones distribuidas;
- observabilidad fragmentada;
- secretos múltiples;
- y agregación compleja.

### Riesgos

- deriva;
- errores de configuración;
- y carga operativa superior a la capacidad actual.

### Resultado

Se conserva como opción futura para regulación, residencia, escala o contrato.

---

## 14. Opción E — Mantener filtros ad hoc

### Descripción

Cada query filtra por empresa, almacén o usuario sin una frontera canónica y sin constraints uniformes.

### Ventajas

- ningún costo inmediato de migración.

### Desventajas

- aislamiento no demostrable;
- duplicación;
- filtros olvidables;
- cachés inseguras;
- autorización inconsistente;
- y alto costo futuro.

### Resultado

Se rechaza.

---

## 15. Decisión propuesta

Se propone:

> **CRUMAFOOD utiliza un esquema PostgreSQL compartido con aislamiento lógico por fila. Tenant es la frontera técnica; `tenant_id UUID` es la clave canónica de aislamiento; Organización es una entidad del negocio contenida por Tenant; y RLS, autorización y constraints compuestas protegen cada operación scoped.**

La decisión incluye:

- `tenant_id NOT NULL` en tablas scoped después del backfill;
- una tabla canónica `tenants`;
- una tabla canónica de organizaciones vinculada a tenant;
- una organización principal visible por tenant en el rollout inicial;
- membresías de identidad a tenant;
- RLS fail-closed;
- relaciones compuestas;
- unicidades por tenant cuando corresponda;
- índices por patrones scoped;
- service role encapsulada;
- caché y mensajes con tenant;
- y pruebas Tenant A/Tenant B.

La decisión no autoriza:

- policies abiertas `using (true)` como solución productiva multi-tenant;
- confiar solo en filtros de UI;
- aceptar `tenant_id` del cliente como autoridad;
- usar service role desde cliente;
- ni afirmar aislamiento antes de probarlo.

---

## 16. Relación Tenant–Organización

Tenant representa:

- frontera de datos;
- membresía;
- configuración técnica;
- integraciones;
- cuotas;
- auditoría;
- y aislamiento operacional.

Organización representa:

- empresa;
- identidad comercial;
- razón social;
- estructura;
- sucursales;
- almacenes;
- y configuración de negocio.

El modelo de datos podrá permitir varias organizaciones por tenant, pero el producto inicial expondrá una organización principal.

---

## 17. Clave canónica

`tenant_id` será:

- UUID;
- opaco;
- inmutable;
- obligatorio en filas scoped;
- no derivado de nombre o slug;
- y propagado en contratos internos.

Los slugs o dominios se resolverán a tenant mediante configuración autorizada.

No sustituirán la clave primaria.

---

## 18. Relaciones compuestas

Las relaciones entre tablas scoped usarán, cuando aplique:

```text
FOREIGN KEY (tenant_id, resource_id)
REFERENCES resource (tenant_id, id)
```

La tabla referenciada tendrá una unicidad compatible:

```text
UNIQUE (tenant_id, id)
```

Esto impide asociar una orden de Tenant A con un almacén de Tenant B incluso si ambos IDs existen.

---

## 19. Unicidades e índices

Las unicidades de negocio incluirán tenant cuando el valor solo deba ser único dentro de esa frontera.

Ejemplos:

- SKU;
- folio;
- código de almacén;
- nombre de integración;
- y clave de idempotencia.

Los índices comenzarán por `tenant_id` cuando el patrón y la selectividad lo justifiquen.

---

## 20. RLS

Las tablas scoped:

- habilitarán RLS;
- forzarán RLS cuando el modelo lo requiera;
- tendrán políticas de SELECT, INSERT, UPDATE y DELETE;
- derivarán tenant desde identidad/membresía;
- aplicarán `USING` y `WITH CHECK`;
- y fallarán cerradas.

Habilitar RLS sin policies no se considerará implementación completa.

Policies temporales amplias no podrán promoverse como aislamiento.

---

## 21. Contexto confiable

El tenant activo se resolverá desde:

- identidad autenticada;
- membresía activa;
- y selección autorizada cuando exista pertenencia múltiple.

El cliente podrá expresar intención, pero el servidor validará autoridad.

No se confiará únicamente en:

- body;
- query;
- header arbitrario;
- localStorage;
- hostname;
- ni claims obsoletos.

---

## 22. Autorización

RLS protege filas.

El caso de uso protege intención.

Cada mutación sensible verificará:

- identidad;
- membresía;
- permiso;
- scope;
- tenant del recurso;
- estado;
- e invariantes.

Ocultar una acción en UI no constituye autorización.

---

## 23. Service role

La service role:

- vivirá solo en backend seguro;
- estará detrás de adaptadores;
- tendrá casos de uso explícitos;
- requerirá tenant;
- aplicará límites;
- registrará auditoría;
- y nunca llegará a Web, Mobile o Desktop.

Un test con service role no demuestra RLS.

---

## 24. SECURITY DEFINER

Las funciones privilegiadas:

- serán mínimas;
- fijarán `search_path`;
- validarán tenant y permiso;
- tendrán owner controlado;
- revocarán acceso público;
- evitarán SQL dinámico inseguro;
- y se probarán por denegación.

No existirán funciones genéricas para saltar RLS.

---

## 25. Caché

Toda key scoped incluirá:

- entorno;
- versión;
- tenant;
- identidad o rol cuando aplique;
- recurso;
- y filtros.

El cambio de tenant limpiará:

- React Query;
- stores;
- caché de servidor;
- datos offline;
- y suscripciones.

No se almacenarán respuestas autenticadas en caché pública.

---

## 26. Storage y Realtime

Storage vinculará objetos a tenant mediante ruta o metadata verificable y policies.

Realtime:

- heredará RLS;
- evitará canales globales con datos de clientes;
- validará membresía;
- y manejará revocación.

Conocer una URL, bucket o canal no concederá acceso.

---

## 27. Jobs, eventos e integraciones

Todo trabajo scoped conservará tenant en:

- comando;
- envelope;
- outbox;
- inbox;
- correlación;
- idempotencia;
- y auditoría.

Los jobs globales procesarán tenants con concurrencia acotada y aislamiento de fallos.

Un tenant no deberá bloquear a los demás.

---

## 28. Consecuencias positivas

- frontera técnica estable;
- terminología clara;
- defensa en profundidad;
- integridad cross-tenant en PostgreSQL;
- una sola evolución de esquema;
- menor costo inicial;
- onboarding centralizado;
- pruebas sistemáticas;
- y ruta futura a aislamiento dedicado.

---

## 29. Consecuencias negativas

- todas las tablas scoped deberán migrarse;
- las FKs y policies serán más complejas;
- la restauración de un tenant requerirá tooling;
- existe blast radius compartido;
- noisy neighbor deberá controlarse;
- queries y cachés deberán propagar tenant;
- y el equipo deberá dominar RLS.

---

## 30. Consecuencias neutrales

- Tenant no será necesariamente visible con ese nombre al usuario;
- Organización seguirá siendo el concepto comercial;
- los administradores de plataforma necesitarán flujos privilegiados separados;
- y una base dedicada futura requerirá nuevo ADR y migración.

---

## 31. Impacto arquitectónico

| Área | Impacto |
|---|---|
| Business Core | Contexto de tenant en comandos, políticas y puertos |
| Datos | Claves, FKs compuestas, índices, RLS y migraciones |
| Seguridad | Membresías, scopes, service role y auditoría |
| Integraciones | Credenciales y mensajes vinculados a tenant |
| Despliegue | Baseline y validación de policies por entorno |
| Frontend | Contexto visible y cachés scoped |
| Mobile | Tenant/almacén activos y comandos offline scoped |
| Desktop | Sesión, almacenamiento y bridge scoped |
| Observabilidad | Tenant seudonimizado y alertas cross-tenant |
| Pruebas | Matriz Tenant A/Tenant B |
| Rendimiento | Índices, cuotas y noisy neighbor |
| Design System | Branding futuro limitado, no seguridad |

---

## 32. Seguridad y privacidad

Amenazas principales:

- IDOR;
- filtrado omitido;
- claim manipulado;
- FK cruzada;
- cache poisoning;
- Storage mal scoped;
- Realtime global;
- export incorrecto;
- service role amplia;
- y logs con identidad comercial.

Controles:

- autorización de caso de uso;
- RLS;
- constraints compuestas;
- claves scoped;
- redacción;
- auditoría;
- pruebas negativas;
- y mínimo privilegio.

---

## 33. Datos y migraciones

La decisión requiere:

- baseline del esquema desplegado;
- clasificación de tablas;
- tabla `tenants`;
- tabla de organizaciones;
- membresías;
- columna `tenant_id`;
- backfill;
- FKs;
- índices;
- policies;
- y enforcement.

La migración seguirá [data-architecture.md](../data-architecture.md) y [multi-tenancy-architecture.md](../multi-tenancy-architecture.md).

---

## 34. Plan de transición

### Fase 0 — Descubrimiento

- extraer esquema real;
- inventariar RLS;
- listar policies;
- identificar datos existentes;
- comparar con `database-map.md`;
- y aprobar clasificación de tablas.

### Fase 1 — Reproducibilidad

- crear baseline versionado;
- fijar ubicación de migraciones;
- reproducir entorno local;
- y registrar drift.

### Fase 2 — Modelo de identidad

- crear Tenant;
- crear Organización;
- crear membresía;
- vincular identidad existente;
- y definir tenant inicial.

### Fase 3 — Expansión

- añadir `tenant_id` nullable;
- actualizar writes;
- propagar contexto;
- y mantener compatibilidad temporal.

### Fase 4 — Backfill

- asignar datos verificados;
- procesar por batches;
- conciliar conteos;
- detectar ambigüedad;
- y repetir de forma idempotente.

### Fase 5 — Integridad

- añadir unicidades scoped;
- crear índices;
- crear FKs compuestas;
- y bloquear cruces.

### Fase 6 — Seguridad

- habilitar policies fail-closed;
- probar credenciales reales;
- encapsular service role;
- y observar denegaciones.

### Fase 7 — Enforcement

- aplicar `NOT NULL`;
- retirar compatibilidad;
- pilotear dos tenants;
- y declarar conformidad.

---

## 35. Rollback y roll-forward

Antes del enforcement podrá revertirse código y desactivar el rollout conservando columnas.

Después de backfill y constraints, se preferirá roll-forward.

No se eliminará `tenant_id` como rollback automático porque:

- perdería evidencia;
- podría recrear cruces;
- y haría insegura la convivencia de versiones.

Toda fase tendrá respaldo y verificación.

---

## 36. Compatibilidad

Durante expansión:

- el código nuevo escribirá tenant;
- el código previo no deberá crear filas sin scope;
- las lecturas serán compatibles;
- y las policies se activarán solo con clientes preparados.

La ventana terminará cuando:

- todas las tablas estén backfilled;
- las versiones desplegadas propaguen tenant;
- y las pruebas A/B pasen.

---

## 37. Rendimiento y capacidad

Se medirán:

- latencia de policies;
- planes de consultas;
- índices por tenant;
- conexiones;
- volumen por tenant;
- cache hit;
- y noisy neighbor.

RLS no se desactivará para mejorar benchmarks.

El aislamiento dedicado se reconsiderará si regulación, residencia, escala o contrato justifican su costo.

---

## 38. Operación

Se requieren:

- dashboard de denegaciones;
- alerta por posible acceso cross-tenant;
- auditoría de service role;
- runbook de fuga;
- inventario de tenants;
- proceso de suspensión;
- backup;
- y restauración ensayada.

El soporte no tendrá acceso permanente a todos los tenants.

---

## 39. Validación previa a Aceptado

Este ADR solo podrá cambiar a Aceptado cuando:

- exista baseline del esquema;
- las tablas estén clasificadas;
- se valide que una organización principal cubre el rollout;
- el diseño de membresía esté definido;
- exista un spike con dos tenants;
- RLS permita A→A y deniegue A→B;
- una FK compuesta rechace una relación cruzada;
- service role esté encapsulada;
- se mida el impacto de policies;
- y Datos y Seguridad aprueben.

---

## 40. Estrategia de pruebas

Se requieren:

- unitarias de contexto;
- casos de uso por permiso y scope;
- integración PostgreSQL;
- RLS positiva y negativa;
- constraints cross-tenant;
- migración desde datos actuales;
- concurrencia;
- caché;
- Storage;
- Realtime;
- jobs;
- API;
- Mobile;
- Desktop;
- y exports.

La prueba canónica usará Tenant A y Tenant B con IDs válidos.

---

## 41. Matriz mínima

| Actor | Operación | Recurso | Resultado |
|---|---|---|---|
| Anónimo | Select | Tenant A | Denegado |
| Miembro A | Select | Tenant A | Permitido por scope |
| Miembro A | Select | Tenant B | Denegado |
| Miembro A | Insert | Tenant B | Denegado |
| Miembro A | Update tenant | A→B | Denegado |
| Miembro suspendido A | Mutación | Tenant A | Denegado |
| Service role autorizada | Caso explícito | Tenant A | Permitido y auditado |

---

## 42. Observabilidad

Se instrumentarán:

- tenant seudonimizado;
- operación;
- policy;
- denegación;
- cambio de contexto;
- uso de service role;
- FK rechazada;
- cache scope;
- job por tenant;
- cuota;
- y correlación.

No se registrarán nombres comerciales ni payloads sensibles como labels.

---

## 43. Riesgos y controles

| Riesgo | Condición | Impacto | Control | Propietario | Señal |
|---|---|---|---|---|---|
| Fuga cross-tenant | Filtro o policy incorrecta | Crítico | RLS, autorización, constraints y pruebas | Seguridad/Datos | Denegación o acceso anómalo |
| FK cruzada | Referencia solo por ID | Alto | FK compuesta | Datos | Error de constraint |
| Cache leak | Key sin tenant | Crítico | Keys scoped y limpieza | Frontend | Test A/B |
| Claim obsoleto | Membresía revocada | Alto | Expiración y consulta confiable | Identity | Acceso tras revocación |
| Service role amplia | Adaptador genérico | Crítico | Casos explícitos y auditoría | Seguridad | Uso privilegiado |
| Policy lenta | Predicado no indexable | Medio/Alto | Índices y EXPLAIN | Datos | Latencia |
| Noisy neighbor | Carga concentrada | Alto | Cuotas y rate limiting | Operación | Saturación por tenant |
| Backfill incorrecto | Dato ambiguo | Crítico | Conciliación y bloqueo | Datos | Filas pendientes |

---

## 44. Costos

### Implementación

- baseline;
- migraciones;
- refactor de queries;
- policies;
- pruebas;
- y observabilidad.

### Operación

- monitoreo de RLS;
- soporte de membresías;
- restauración scoped;
- y capacity planning.

### Costo de salida

Mover un tenant a base dedicada requerirá exportación consistente, provisioning, routing y migraciones.

### Costo de no decidir

El costo incluye riesgo de fuga, duplicación de modelos, deuda de migración y bloqueo del onboarding.

---

## 45. Cumplimiento arquitectónico

Este ADR desarrolla:

- [multi-tenancy-architecture.md](../multi-tenancy-architecture.md);
- [data-architecture.md](../data-architecture.md);
- [security-architecture.md](../security-architecture.md);
- [business-core.md](../business-core.md);
- [integration-architecture.md](../integration-architecture.md);
- [performance-architecture.md](../performance-architecture.md);
- y [testing-strategy.md](../testing-strategy.md).

Si se acepta, esos documentos deberán actualizar su sección de decisiones pendientes para enlazar ADR-0001.

---

## 46. Plan de implementación

| Entrega | Alcance | Propietario | Dependencia | Evidencia |
|---|---|---|---|---|
| Baseline | Esquema y policies reales | Datos | Acceso al proyecto | Migración reproducible |
| Modelo Identity | Tenant, Organización y membresía | Identity | Baseline | Casos de uso y tests |
| Expansión | `tenant_id` y writes | Módulos | Modelo Identity | Filas nuevas scoped |
| Backfill | Datos existentes | Datos | Clasificación | Conciliación completa |
| Seguridad | RLS y service role | Seguridad/Datos | Backfill | Matriz A/B |
| Piloto | Dos tenants | Producto/Operación | Clientes preparados | Sin cruces y SLO aceptable |
| Enforcement | NOT NULL y retiro de compatibilidad | Datos | Piloto | Conformidad |

---

## 47. Preguntas abiertas

Antes de Aceptado se resolverá:

- ¿cuál es el esquema desplegado real?;
- ¿qué tablas son globales?;
- ¿todos los datos actuales pertenecen a una sola organización?;
- ¿cuál será el nombre de tablas de membresía?;
- ¿cómo se resolverá el tenant activo con Supabase Auth?;
- ¿qué versiones cliente deben convivir durante migración?;
- ¿qué requisito de restauración por tenant existe?;
- y ¿qué volumen por tenant se espera?

Después de Aceptado podrán decidirse por ADR separado:

- multi-organización visible;
- dominios personalizados;
- impersonation;
- planes y cuotas comerciales;
- y aislamiento dedicado.

---

## 48. Triggers de revisión

Este ADR deberá revisarse cuando:

- un cliente requiera aislamiento físico;
- cambie la regulación;
- exista necesidad multirregión;
- el volumen cause noisy neighbor no controlable;
- la latencia RLS exceda objetivos;
- Supabase cambie una capacidad esencial;
- la restauración scoped sea insuficiente;
- o el modelo necesite varias organizaciones con autonomía.

Fecha de revisión sugerida: después del piloto de dos tenants o antes de onboarding externo.

---

## 49. Registro de aprobación

| Rol | Decisión | Fecha | Evidencia |
|---|---|---|---|
| Product Owner | Pendiente | — | — |
| Responsable de arquitectura | Pendiente | — | — |
| Responsable de datos | Pendiente | — | — |
| Responsable de seguridad | Pendiente | — | — |

El estado permanecerá Propuesto mientras exista una aprobación pendiente o no se cumpla la validación mínima.

---

## 50. Historial

| Fecha | Cambio | Autor o rol |
|---|---|---|
| 2026-07-12 | Propuesta inicial | Responsable de arquitectura |

Después de Aceptado, un cambio de decisión requerirá un ADR nuevo.

---

## 51. Referencias

- [Registro ADR](README.md)
- [Plantilla ADR](0000-template.md)
- [Índice de arquitectura](../README.md)
- [Arquitectura multi-tenant](../multi-tenancy-architecture.md)
- [Arquitectura de datos](../data-architecture.md)
- [Arquitectura de seguridad](../security-architecture.md)
- [Estrategia de pruebas](../testing-strategy.md)

---

## 52. Resultado de la propuesta

Si se acepta, CRUMAFOOD tendrá una frontera canónica que permita:

- migrar datos con criterio uniforme;
- probar aislamiento;
- construir membresías;
- normalizar autorización;
- separar cachés y mensajes;
- y habilitar onboarding multi-tenant con una base verificable.

Si se rechaza, el ADR conservará las razones y deberá elegirse una alternativa antes de implementar multi-tenancy productivo.

---

## 53. Declaración final

> **El aislamiento de CRUMAFOOD no dependerá de recordar un filtro. Tenant será una frontera técnica explícita y PostgreSQL deberá impedir que una operación válida dentro de una organización se convierta en acceso válido a otra.**
