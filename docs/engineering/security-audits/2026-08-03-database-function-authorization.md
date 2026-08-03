# Auditoría de autorización de funciones y mutaciones de base de datos

## Metadata

| Campo | Valor |
|---|---|
| Estado | Verificado |
| Fecha | 2026-08-03 |
| Alcance | Autorización administrativa, Server Actions, RPC PostgreSQL, grants, RLS y modelo de roles |
| Rama de análisis | `agent/audit-database-function-security` |
| Baseline analizado | `supabase/migrations/20260802000000_schema_baseline.sql` |
| Referencia arquitectónica | `docs/architecture/security-architecture.md` |
| Cambios sobre Production | Ninguno |
| Datos productivos inspeccionados | Ninguno |

---

## 1. Resumen ejecutivo

La auditoría confirma una no conformidad de severidad alta entre la implementación actual y la arquitectura de seguridad aprobada.

La protección administrativa no es uniforme, varias mutaciones críticas no autorizan explícitamente el caso de uso y existen policies RLS excesivamente permisivas para cualquier usuario autenticado.

También se identificaron funciones expuestas con grants amplios, funciones sin un `search_path` controlado, RPC incompatibles con las policies de sus tablas subyacentes y operaciones de inventario no transaccionales que pueden producir estados parciales.

El baseline canónico no deberá modificarse. Toda corrección deberá realizarse mediante código posterior, migraciones nuevas y pruebas positivas y negativas.

---

## 2. Alcance

La auditoría revisó:

- middleware y layout del grupo administrativo;
- validaciones de sesión en Server Actions;
- consulta de roles;
- referencias RPC literales encontradas por el inventario;
- definiciones de funciones PostgreSQL;
- grants sobre funciones;
- policies RLS relacionadas;
- flujos de creación de órdenes de producción;
- flujo de entrega de pedidos y decremento de lotes;
- y coherencia entre roles utilizados por código y esquema.

No incluyó:

- lectura de datos de Production;
- modificación de proyectos Supabase alojados;
- pruebas de penetración;
- ejecución de exploits;
- inventario completo de todas las rutas;
- ni rediseño definitivo de multi-tenancy.

---

## 3. Método y evidencia

Se utilizaron:

- el baseline SQL versionado;
- `pnpm run db:inventory`;
- inspección estática de Server Actions;
- inspección del cliente Supabase SSR;
- revisión del middleware;
- revisión de `security-architecture.md`;
- y comparación entre código, constraints, grants y policies.

El inventario identificó:

- 49 relaciones Supabase referenciadas literalmente;
- 2 RPC invocadas directamente;
- 0 buckets referenciados literalmente.

Las RPC invocadas directamente son:

| Función | Consumidor |
|---|---|
| `create_production_order_items(uuid)` | `production-orders/actions.ts` |
| `decrease_product_lot_quantity(uuid, numeric)` | `sales-orders/actions.ts` |

---

## 4. Escala de severidad

| Severidad | Criterio |
|---|---|
| Crítica | Acceso o mutación no autorizada demostrada con impacto material inmediato |
| Alta | Control obligatorio ausente o inconsistente, con posibilidad razonable de acceso indebido o corrupción |
| Media | Debilidad que amplifica riesgo o vuelve ambiguo el contrato |
| Baja | Mejora preventiva sin impacto material inmediato |

Esta auditoría no declara una explotación demostrada. Registra controles ausentes o contradictorios que impiden demostrar autorización de extremo a extremo.

---

## 5. Hallazgos

### SEC-DB-001 — Protección administrativa incompleta

**Severidad:** Alta

**Prioridad:** P0

El middleware protege únicamente:

- `/dashboard`;
- `/users`;
- `/products`.

No protege uniformemente rutas como:

- `/production-orders`;
- `/sales-orders`;
- inventario;
- compras;
- operaciones móviles;
- ni otras superficies administrativas.

El layout principal de `(admin)` solo renderiza navegación y contenido; no resuelve identidad ni autorización.

**Riesgo:** asumir que pertenecer al grupo de rutas `(admin)` implica protección.

**Control requerido:** protección coherente por superficie y autorización dentro de cada caso de uso.

---

### SEC-DB-002 — Server Actions críticas sin autorización explícita

**Severidad:** Alta

**Prioridad:** P0

Las acciones auditadas crean un cliente SSR con la clave pública `anon` y cookies del usuario, pero no ejecutan explícitamente:

- `auth.getUser()`;
- resolución de actor;
- comprobación de permiso;
- comprobación de alcance;
- ni auditoría de autorización.

Las acciones afectadas incluyen al menos:

- creación de órdenes de producción;
- entrega de pedidos;
- generación de líneas de producción;
- y decremento de lotes.

**Riesgo:** confiar exclusivamente en navegación previa, cookies o RLS para autorizar una intención de negocio.

**Control requerido:** guard central basado en actor, permiso, recurso, alcance y contexto.

---

### SEC-DB-003 — Policies permisivas para cualquier usuario autenticado

**Severidad:** Alta

**Prioridad:** P0

`production_orders` contiene policies para `authenticated` con expresiones globales:

- `SELECT USING (true)`;
- `INSERT WITH CHECK (true)`;
- `UPDATE USING (true) WITH CHECK (true)`;
- `DELETE USING (true)`.

También existe una policy administrativa, pero las policies permisivas se combinan mediante `OR`. La policy administrativa no restringe las policies abiertas.

Se observaron patrones similares en otras relaciones operativas, incluyendo `recipe_items`.

**Riesgo:** cualquier usuario autenticado puede obtener capacidades operativas sin demostrar permiso administrativo o alcance.

**Control requerido:** eliminar policies globales por comodidad y sustituirlas por identidad, permiso y alcance verificables.

---

### SEC-DB-004 — RPC incompatibles con RLS de tablas subyacentes

**Severidad:** Alta

**Prioridad:** P0

Las funciones:

- `create_production_order_items`;
- `decrease_product_lot_quantity`;

son `SECURITY INVOKER` implícitas.

Las tablas:

- `production_order_items`;
- `product_lots`;

tienen RLS habilitado y no contienen policies aplicables en el baseline.

Por tanto, las RPC deberían ser denegadas para clientes normales, aunque tengan permiso `EXECUTE`.

La aplicación controla el error de `create_production_order_items`, pero ignora el resultado de `decrease_product_lot_quantity`.

**Riesgo:** funcionalidad aparentemente disponible que falla por RLS, con errores visibles en un flujo y silenciosos en otro.

**Control requerido:** definir explícitamente el modelo de acceso, mantener denegación por defecto y probar permisos positivos y negativos.

---

### SEC-DB-005 — Funciones sin `search_path` controlado

**Severidad:** Alta

**Prioridad:** P0

Las funciones `SECURITY DEFINER`:

- `handle_new_user()`;
- `is_admin(uuid)`;

no fijan un `search_path` seguro.

Las dos RPC auditadas también utilizan nombres de relaciones sin schema explícito, como:

- `production_orders`;
- `production_order_items`;
- `recipe_items`;
- `product_lots`.

**Riesgo:** resolución ambigua de objetos y superficie innecesaria en funciones privilegiadas.

**Control requerido:**

- fijar `search_path` vacío o explícitamente seguro;
- calificar objetos con schema;
- justificar cada `SECURITY DEFINER`;
- y agregar pruebas específicas.

---

### SEC-DB-006 — Grants de funciones excesivamente amplios

**Severidad:** Alta

**Prioridad:** P0

Las 11 funciones exportadas conceden ejecución a:

- `anon`;
- `authenticated`;
- `service_role`.

Esto incluye:

- RPC de mutación;
- funciones auxiliares;
- funciones usadas por triggers;
- y funciones `SECURITY DEFINER`.

La aplicación solo referencia directamente dos RPC, ambas desde flujos administrativos.

**Riesgo:** superficie de ejecución mayor que la requerida y exposición accidental mediante Data API.

**Control requerido:** revocar por defecto y conceder `EXECUTE` únicamente a los roles y funciones justificadas.

---

### SEC-DB-007 — Entrega de pedidos no atómica y con errores ignorados

**Severidad:** Alta

**Prioridad:** P0

`deliverSalesOrder()`:

1. intenta insertar movimientos de inventario;
2. continúa procesando lotes antes de comprobar `movementError`;
3. selecciona un `picking_order_item` solo por `product_id`;
4. no limita claramente la selección al pedido o picking correspondiente;
5. ejecuta `decrease_product_lot_quantity`;
6. ignora el error devuelto por la RPC;
7. y no utiliza una transacción única.

La función SQL reduce la cantidad usando `greatest(quantity - p_quantity, 0)` y no informa:

- lote inexistente;
- cantidad insuficiente;
- ni cero filas afectadas.

**Riesgo:** movimientos sin decremento, decrementos sin movimiento, lote incorrecto o inventario truncado silenciosamente a cero.

**Control requerido:** encapsular la operación completa en una transacción y fallar ante cualquier inconsistencia.

---

### SEC-DB-008 — Creación de órdenes de producción no atómica ni idempotente

**Severidad:** Alta

**Prioridad:** P1

`createProductionOrder()`:

1. inserta la orden;
2. después ejecuta `create_production_order_items`;
3. y deja la orden creada si la RPC falla.

La función SQL no expresa una protección idempotente explícita. Un reintento puede fallar o duplicar líneas dependiendo de constraints y estado previo.

**Riesgo:** órdenes incompletas, reintentos inseguros y estados parciales.

**Control requerido:** crear orden y líneas dentro de una misma operación transaccional e idempotente.

---

### SEC-DB-009 — Contrato de roles inconsistente

**Severidad:** Media

**Prioridad:** P1

El constraint de `user_roles.role` permite únicamente:

- `admin`;
- `customer`.

El código de productos también acepta `manager`, pero ese rol no puede persistirse con el esquema actual.

La unicidad es `(user_id, role)`, por lo que un usuario puede tener múltiples roles.

Sin embargo, `getUserRole(userId)` utiliza `.single()` y supone un único resultado. Cuando un usuario tenga más de un rol, la consulta devolverá error y el helper responderá `null`.

**Riesgo:** autorización ambigua, rol imposible y denegaciones silenciosas.

**Control requerido:** decidir explícitamente entre rol único o múltiples roles y alinear schema, tipos, consultas, matriz y pruebas.

---

## 6. Conformidad con la arquitectura aprobada

Los hallazgos incumplen requisitos existentes de `security-architecture.md`:

- defensa en profundidad;
- mínimo privilegio;
- autorización en servidor;
- autorización en cada mutación;
- middleware no utilizado como única barrera;
- Server Actions tratadas como adaptadores no confiables;
- ejecución transaccional;
- RLS con denegación por defecto;
- prohibición de policies globales permisivas;
- `SECURITY DEFINER` con `search_path` seguro;
- y pruebas positivas y negativas.

No se requiere un ADR nuevo para afirmar estos principios.

---

## 7. Decisiones de contención

Hasta completar la remediación:

- no ampliar grants;
- no agregar nuevas policies `USING (true)` o `WITH CHECK (true)`;
- no utilizar `service_role` para ocultar fallos de RLS;
- no modificar el baseline ya fusionado;
- no considerar el middleware como autorización suficiente;
- no reutilizar `getUserRole()` como guard;
- y no desplegar cambios de permisos sin pruebas negativas.

---

## 8. Secuencia de remediación

### Entrega A — Fundación de autorización

- definir `Actor`;
- definir el contrato de roles múltiples o rol único;
- crear catálogo tipado de permissions;
- crear matriz explícita;
- implementar `requireAuthenticatedUser`;
- implementar `requirePermission`;
- diferenciar errores de autenticación y autorización;
- y agregar pruebas unitarias.

### Entrega B — Contención de mutaciones críticas

- proteger creación de órdenes de producción;
- proteger entrega de pedidos;
- comprobar permisos específicos;
- comprobar transición de estado;
- manejar todos los errores de Supabase;
- y registrar evidencia de denegación.

### Entrega C — Migración de seguridad PostgreSQL

- fijar `search_path`;
- calificar relaciones con `public`;
- revisar cada `SECURITY DEFINER`;
- revocar grants innecesarios;
- conceder permisos mínimos;
- sustituir policies permisivas;
- crear policies faltantes;
- y mantener el baseline inmutable.

### Entrega D — Integridad transaccional

- convertir creación de orden y líneas en una sola transacción;
- convertir entrega, movimientos, lote y reservas en una sola transacción;
- verificar cantidades disponibles;
- impedir cantidades negativas o truncamientos silenciosos;
- asegurar selección del lote correcto;
- y diseñar idempotencia.

### Entrega E — Pruebas y CI

- pruebas de usuario anónimo denegado;
- pruebas de customer denegado;
- pruebas de admin autorizado;
- pruebas de alcance incorrecto;
- pruebas RLS positivas y negativas;
- pruebas de grants;
- pruebas de `search_path`;
- pruebas de rollback completo;
- reset desde migraciones;
- y ejecución obligatoria en CI.

---

## 9. Criterios de aceptación de la remediación

La remediación no estará completa hasta demostrar que:

- toda mutación administrativa resuelve actor;
- cada acción exige un permiso explícito;
- un usuario anónimo es denegado;
- un customer autenticado es denegado en operaciones administrativas;
- un actor autorizado puede completar el caso de uso;
- ninguna policy global permisiva concede acceso administrativo;
- las funciones privilegiadas fijan `search_path`;
- `anon` no ejecuta RPC administrativas;
- los errores de RPC nunca se ignoran;
- las operaciones críticas son atómicas;
- los reintentos son seguros;
- el baseline permanece sin modificaciones;
- y CI ejecuta pruebas de autorización y base de datos.

---

## 10. Preguntas que requieren decisión de implementación

Antes de implementar la matriz deberá resolverse:

1. ¿`user_roles` representa un rol único o múltiples roles por usuario?
2. ¿`manager` debe existir o debe eliminarse del código?
3. ¿Qué permissions corresponden a `customer`?
4. ¿Qué roles operativos se necesitan para producción, ventas, inventario y calidad?
5. ¿Qué alcance se aplicará antes del modelo multi-tenant definitivo?
6. ¿Qué RPC deben permanecer expuestas mediante Data API?
7. ¿Qué operaciones deben convertirse en funciones transaccionales?

Estas preguntas no suspenden la contención de `anon`, el control de `search_path` ni el manejo obligatorio de errores.

---

## 11. Resultado

La auditoría demuestra que el baseline ya permite identificar diferencias concretas entre el esquema desplegado, el código y la arquitectura objetivo.

La siguiente entrega no deberá modificar el baseline ni aplicar cambios directamente en Production. Deberá implementar primero la fundación mínima de autorización con pruebas y preparar migraciones posteriores, revisables e inmutables.

---

## 12. Referencias

- [Arquitectura de seguridad](../../architecture/security-architecture.md)
- [ADR-0002: Baseline y migraciones canónicas](../../architecture/adr/0002-schema-baseline-and-migrations.md)
- [Principios de ingeniería](../engineering-principles.md)
- [Engineering Operating System](../engineering-operating-system.md)