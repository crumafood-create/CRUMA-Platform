# Arquitectura de Datos de CRUMAFOOD Platform

> **Los datos representan hechos del negocio. Deben ser correctos, íntegros, trazables, protegidos y recuperables.**

## Estado del documento

| Campo | Valor |
|---|---|
| ## Estado del documento

| Campo | Valor |
|---|---|
| Estado | Aprobado |
| Versión | 2.0 |
| Propietarios | Product Owner y responsable de Arquitectura de Datos |
| Aprobado por | Product Owner de CRUMAFOOD Platform |
| Fecha de aprobación | 2026-07-23 |
| Alcance | Datos operativos, persistencia, integridad, seguridad, auditoría, evolución y recuperación |
| Autoridad | Derivado de `system-overview.md` y `business-core.md` |
| Documentos relacionados | `multi-tenancy-architecture.md`, `security-architecture.md`, `integration-architecture.md`, `observability-architecture.md` y `performance-architecture.md` |
| Sustituye | Versión 1.0 de `data-architecture.md` |
| Revisión | Cuando cambien modelos críticos, límites de propiedad, políticas de acceso o estrategia de persistencia |

---

## 1. Propósito

Este documento define cómo CRUMAFOOD Platform modelará, almacenará, protegerá, consultará, evolucionará y recuperará sus datos.

La arquitectura deberá asegurar que la información utilizada por Catálogo, Inventario, Almacenes, Producción, Compras, Ventas, Calidad, Costos y Distribución sea:

- correcta;
- consistente;
- trazable;
- autorizada;
- recuperable;
- comprensible;
- y útil para operación y análisis.

PostgreSQL, operado actualmente mediante Supabase, será la fuente de autoridad para el estado transaccional compartido.

---

## 2. Declaración arquitectónica

> **CRUMAFOOD utilizará un modelo de datos modular, transaccional y auditable, en el que cada hecho de negocio tenga un propietario explícito, cada cambio crítico deje evidencia y cada proyección pueda reconstruirse desde fuentes autorizadas.**

La base de datos no será un contenedor pasivo de formularios. Será una barrera activa de integridad mediante:

- tipos apropiados;
- claves primarias y foráneas;
- restricciones;
- políticas RLS;
- transacciones;
- funciones controladas;
- auditoría;
- y migraciones versionadas.

---

## 3. Alcance

Este documento cubre:

- datos maestros, transaccionales, de referencia, derivados, analíticos y de auditoría;
- propiedad de datos por módulo;
- convenciones de esquema;
- multi-tenancy y alcance organizacional;
- integridad estructural y reglas cercanas a los datos;
- inventario, lotes, reservas, FEFO y trazabilidad;
- cantidades, unidades, dinero, costos y tiempo;
- RLS, Supabase y acceso privilegiado;
- funciones, triggers y procedimientos;
- migraciones, compatibilidad y prevención de deriva;
- calidad, observabilidad, respaldo y recuperación;
- gobierno y conformidad.

No define por sí solo:

- reglas completas de autorización, descritas en `security-architecture.md`;
- topología completa de tenancy, descrita en `multi-tenancy-architecture.md`;
- telemetría general, descrita en `observability-architecture.md`;
- ni contratos funcionales completos de cada módulo.

---

## 4. Principios rectores

### 4.1 Una fuente de autoridad

Cada hecho tendrá una ubicación principal y un módulo propietario.

### 4.2 Integridad por diseño

La integridad no dependerá solamente de formularios o componentes visuales.

### 4.3 Trazabilidad antes que mutación destructiva

Los errores operativos se corregirán mediante reversión, compensación o nuevo hecho trazable, no borrando historia.

### 4.4 Escritura protegida, lectura optimizada

El modelo de escritura protege invariantes. Los modelos de lectura podrán optimizarse para búsqueda, reportes y analítica.

### 4.5 Cambios compatibles

Los esquemas evolucionarán sin obligar a desplegar todos los consumidores simultáneamente.

### 4.6 Seguridad por defecto

Todo acceso se limitará por identidad, organización, alcance y permiso.

### 4.7 Recuperabilidad verificable

Un respaldo no será considerado confiable hasta que su restauración haya sido probada.

### 4.8 Precisión semántica

Un campo debe expresar claramente qué representa, en qué unidad, moneda, zona horaria y estado.

---

## 5. Estado actual

La plataforma utiliza actualmente:

- PostgreSQL administrado mediante Supabase;
- Supabase Auth;
- Supabase Storage;
- Row Level Security;
- clientes Supabase server y browser;
- migraciones SQL versionadas;
- tablas operativas para catálogo, productos e inventario;
- borrado lógico en entidades seleccionadas;
- y restricciones incorporadas progresivamente.

Riesgos actuales que deberán reducirse de manera incremental:

- acceso directo a Supabase desde múltiples capas;
- reglas de negocio dispersas en páginas o acciones;
- ownership de tablas no siempre documentado;
- operaciones de varias escrituras sin frontera transaccional clara;
- auditoría incompleta;
- y modelos todavía orientados a pantallas en lugar de capacidades.

---

## 6. Estado objetivo

El estado objetivo incluye:

- módulos propietarios de sus datos;
- repositorios y gateways explícitos;
- casos de uso que coordinan transacciones;
- funciones PostgreSQL para operaciones atómicas justificadas;
- RLS consistente en tablas expuestas;
- inventario basado en movimientos;
- saldos reconciliables;
- recetas, costos y configuraciones versionadas;
- outbox para eventos confiables;
- auditoría proporcional al riesgo;
- modelos de lectura reconstruibles;
- migraciones compatibles;
- monitoreo de calidad e integridad;
- y procedimientos probados de recuperación.

La transición será incremental. No se realizará una reescritura total.

---

## 7. Jerarquía de autoridad

Cuando dos capas puedan proteger una regla, se aplicará la siguiente jerarquía:

1. **Dominio:** expresa significado e invariantes del negocio.
2. **Aplicación:** autoriza, coordina y delimita la unidad de trabajo.
3. **Base de datos:** garantiza integridad estructural y atomicidad.
4. **RLS:** limita filas accesibles por identidad y alcance.
5. **Interfaz:** previene errores y mejora experiencia, sin ser autoridad final.
6. **Modelos de lectura:** presentan información derivada, sin gobernar la escritura.

Una validación importante podrá existir en más de una capa, pero deberá tener una fuente de autoridad identificable.

---

## 8. Dominios de datos

### 8.1 Datos maestros

- productos;
- categorías;
- familias;
- unidades;
- presentaciones;
- clientes;
- proveedores;
- almacenes;
- ubicaciones;
- recetas;
- configuraciones.

### 8.2 Datos transaccionales

- movimientos;
- reservas;
- recepciones;
- órdenes;
- consumos;
- lotes generados;
- inspecciones;
- despachos;
- entregas.

### 8.3 Datos de referencia

- tipos de movimiento;
- motivos;
- monedas;
- unidades;
- estados controlados;
- tipos de documento.

### 8.4 Datos derivados

- saldos;
- disponibilidad;
- ATP;
- costos calculados;
- indicadores;
- proyecciones.

### 8.5 Datos de auditoría y operación

- actor;
- acción;
- valores relevantes;
- correlación;
- resultado;
- origen;
- marcas de tiempo.

---

## 9. Propiedad de datos

| Módulo | Datos principales | No debe modificar directamente |
|---|---|---|
| Identity & Access | identidades, membresías, roles, permisos y contexto activo | datos operativos de otros módulos |
| Catalog | productos, categorías, familias, unidades, presentaciones | existencias y movimientos |
| Inventory | movimientos, reservas y proyecciones autorizadas de saldo y disponibilidad | órdenes de producción o compra |
| Warehouse | almacenes, ubicaciones, conteos, transferencias físicas | reglas de catálogo |
| Production | recetas, versiones, órdenes, consumos planeados y reales | saldos de inventario directamente |
| Purchasing | proveedores, solicitudes, órdenes, compromisos | existencias directamente |
| Sales | clientes, cotizaciones, pedidos, precios | saldos directamente |
| Quality | especificaciones, inspecciones, liberaciones, bloqueos | movimientos históricos |
| Costing | reglas, costos, periodos, variaciones | fuentes transaccionales originales |
| Distribution | despachos, rutas, entregas | pedidos o inventario sin contrato |

El ownership definitivo de tenants, organizaciones y sucursales será establecido por `multi-tenancy-architecture.md` y el ADR correspondiente.

Las referencias a `organization_id`, organización y sucursal en este documento expresan requisitos de aislamiento, pero no cierran todavía el modelo físico definitivo.

Otros módulos leerán o solicitarán cambios mediante contratos explícitos.

---

## 10. Inventario preliminar de relaciones

### 10.1 Catalog

`products` se relaciona con categorías, familias, sabores, unidades y presentaciones. Catalog define qué es un producto; Inventory define cuánto existe.

### 10.2 Inventory y Warehouse

Inventory registra movimientos y saldos. Warehouse define almacenes, ubicaciones y ejecución física. Una ubicación pertenece a un almacén y un saldo se determina por producto, lote, ubicación y estado utilizable.

### 10.3 Purchasing

Una orden de compra contiene líneas de producto. Una recepción física puede ser parcial y genera, después de las validaciones aplicables, movimientos de inventario.

### 10.4 Production y Costing

Una orden de producción referencia una versión de receta. Sus consumos y terminados se reflejan en Inventory. Costing consume hechos históricos sin sustituirlos.

La planificación se considera inicialmente una capacidad de Production. Su separación como módulo requerirá una decisión arquitectónica explícita.

### 10.5 Sales y Distribution

Un pedido puede originar reservas. Distribution prepara y entrega. Inventory registra los movimientos físicos resultantes.

### 10.6 Identity y System Operations

Las entidades operativas se relacionan con organización, sucursal, almacén, actor y correlación cuando corresponda.

No se utilizarán relaciones por texto libre cuando exista una entidad identificable.

---

## 11. Convenciones de nombres

### 11.1 Tablas y columnas

- tablas en plural;
- nombres en `snake_case`;
- términos completos del negocio;
- nombres de claves foráneas terminados en `_id`;
- fechas en `_at` para instantes y `_date` para fechas de negocio;
- booleanos con prefijos como `is_`, `has_` o `can_` cuando mejoren claridad.

Ejemplos:

```text
products
inventory_movements
production_orders
purchase_order_lines
warehouse_locations
expiration_date
created_at
is_active
```

### 11.2 Columnas comunes

Cuando aplique:

```text
id
organization_id
created_at
created_by
updated_at
updated_by
deleted_at
version
```

No todas las tablas necesitan todas las columnas.

---

## 12. Identificadores

Los identificadores internos usarán UUID cuando:

- se generen en distintos clientes;
- participen en sincronización;
- no deban revelar secuencia;
- o deban ser únicos entre entornos.

Los códigos visibles se almacenarán por separado:

```text
id = 8e7e...
internal_code = MP-AGUA
```

Reglas:

- un código visible no sustituye la clave primaria;
- un código histórico no se reutiliza sin una política explícita;
- los folios secuenciales se asignarán mediante una operación atómica;
- los identificadores externos deberán indicar su proveedor u origen.

---

## 13. Alcance organizacional y multi-tenancy

Toda tabla compartida entre organizaciones deberá evaluar si necesita `organization_id`.

Reglas:

- `organization_id` no será confiado únicamente porque venga del cliente;
- claves únicas se evaluarán dentro del alcance organizacional;
- índices frecuentes comenzarán por `organization_id` cuando el patrón de consulta lo justifique;
- RLS comprobará membresía activa;
- relaciones entre tablas deberán preservar el mismo alcance;
- recursos globales serán excepciones explícitas.

Ejemplo de unicidad por organización:

```sql
create unique index products_code_org_unique
on products (organization_id, lower(internal_code))
where deleted_at is null;
```

El modelo completo de aislamiento se define en `multi-tenancy-architecture.md`.

---

## 14. Integridad estructural

PostgreSQL protegerá invariantes mediante:

- `NOT NULL`;
- `UNIQUE`;
- `CHECK`;
- claves primarias;
- claves foráneas;
- índices únicos parciales;
- restricciones de exclusión cuando sean apropiadas.

Ejemplos:

```sql
check (quantity > 0)
check (unit_cost >= 0)
check (expiration_date is null or expiration_date >= production_date)
```

Reglas:

- no usar `ON DELETE CASCADE` en datos críticos sin justificación;
- indexar claves foráneas de uso frecuente;
- impedir referencias entre organizaciones incompatibles;
- no representar relaciones mediante nombres o códigos editables.

---

## 15. Estados y transiciones

Los estados no se almacenarán como texto libre sin control.

Opciones válidas:

- `CHECK`;
- tablas de referencia;
- tipos de dominio;
- enums PostgreSQL cuando el conjunto sea muy estable.

Las transiciones importantes pertenecen al Business Core.

Ejemplo:

```text
DRAFT -> APPROVED -> IN_PROGRESS -> COMPLETED
```

No deberá ser posible saltar una transición protegida mediante una actualización directa.

Cada cambio crítico de estado registrará actor, fecha y motivo cuando corresponda.

---

## 16. Transacciones y unidad de trabajo

Una unidad de trabajo abarcará todos los cambios necesarios para conservar consistencia.

Ejemplo:

```text
registrar consumo
├── validar orden y lote
├── insertar movimiento
├── actualizar proyección autorizada de saldo
├── relacionar consumo
└── registrar evento de outbox
```
La actualización de una proyección de saldo deberá ocurrir dentro de la misma operación atómica que registra el movimiento.

La interfaz, los clientes y otros módulos no podrán modificar saldos directamente.

Si una falla intermedia puede dejar un estado inválido, la operación debe ejecutarse dentro de una transacción o mecanismo equivalente.

La frontera transaccional será coordinada por la capa de aplicación e implementada cerca de PostgreSQL.

---

## 17. Concurrencia

La estrategia dependerá del caso:

- actualización condicional;
- columna `version`;
- bloqueo de fila;
- restricción única;
- advisory lock;
- función PostgreSQL;
- serialización de trabajo.

El siguiente ejemplo representa una actualización interna de una proyección controlada por Inventory. No autoriza actualizaciones directas de `inventory_balances` desde interfaces u otros módulos y deberá ejecutarse de forma atómica con el movimiento que la origina.

Ejemplo de control optimista:

```sql
update inventory_balances
set quantity = quantity - :amount,
    version = version + 1
where id = :id
  and version = :expected_version;
```

Si no se actualiza ninguna fila, se deberá tratar como conflicto, no como éxito.

---

## 18. Idempotencia

Las operaciones reintentables deberán impedir duplicación de efectos.

Aplicaciones principales:

- recepciones;
- movimientos;
- consumos;
- producción terminada;
- webhooks;
- sincronización móvil;
- importaciones;
- integraciones.

Una clave de idempotencia deberá identificar intención, alcance y resultado.

Modelo conceptual:

```text
idempotency_keys
├── key
├── scope
├── request_hash
├── status
├── response_reference
└── expires_at
```

---

## 19. Inventario como libro de movimientos

La fuente principal de verdad será el registro de movimientos, no un saldo editable.

Cada movimiento deberá incluir, según aplique:

- organización;
- producto;
- cantidad;
- unidad;
- tipo o dirección;
- almacén;
- ubicación;
- lote;
- documento origen;
- motivo;
- actor;
- fecha efectiva;
- fecha de registro;
- clave de idempotencia;
- correlación.

Ejemplo:

```text
Entrada +100
Salida   -20
Ajuste    -2
Saldo     78
```

Un error se corrige con movimiento compensatorio, no modificando la historia original.

---

## 20. Disponibilidad, reservas y ATP

Se distinguirán al menos:

```text
existencia física
existencia bloqueada
existencia reservada
existencia disponible
available to promise (ATP)
```

Regla conceptual:

```text
disponible = física - bloqueada - reservada
```

ATP puede incorporar recepciones y producción futura confirmada, según una política documentada.

Cada reserva deberá tener:

- origen;
- cantidad;
- producto y lote cuando aplique;
- estado;
- fecha de vencimiento opcional;
- actor;
- entidad relacionada.

La reserva, liberación y consumo deberán ser idempotentes.

---

## 21. Lotes, FEFO y trazabilidad

Un lote permitirá rastrear:

- producto;
- código;
- origen;
- proveedor u orden de producción;
- fecha de producción;
- fecha de caducidad;
- estado de calidad;
- cantidades;
- ubicaciones;
- movimientos relacionados.

FEFO seleccionará primero el lote utilizable con caducidad más próxima.

Debe excluir lotes:

- vencidos;
- bloqueados;
- sin existencia;
- no disponibles;
- reservados por otra operación;
- o incompatibles con la política aplicable.

La decisión FEFO deberá ser reproducible y auditable.

---

## 22. Unidades y cantidades

Las cantidades utilizarán tipos exactos, por ejemplo:

```sql
quantity numeric(18,6)
```

Cada cantidad deberá tener una unidad inequívoca.

Las conversiones declararán:

- unidad origen;
- unidad destino;
- factor;
- precisión;
- regla de redondeo;
- vigencia cuando afecte historia.

No se sumarán unidades incompatibles.

Las unidades base y de compra, producción o venta podrán ser distintas, pero su relación debe ser explícita.

---

## 23. Dinero y costos

Los importes utilizarán `numeric`, nunca `float`.

Todo valor monetario deberá incluir o inferir de forma inequívoca:

- moneda;
- escala;
- regla de redondeo;
- fecha o periodo de vigencia;
- fuente del cálculo.

Los costos históricos deben poder reproducirse.

Cambiar una configuración futura no deberá reescribir el costo histórico de una operación cerrada.

---

## 24. Tiempo y zonas horarias

### Instantes

Se almacenarán como `timestamptz`.

Ejemplos:

- creación;
- aprobación;
- movimiento;
- inicio y finalización;
- recepción.

### Fechas de negocio

Se almacenarán como `date` cuando no representen un instante.

Ejemplos:

- caducidad;
- fecha de producción;
- fecha prometida;
- periodo contable.

La presentación utilizará la zona horaria de la organización o del usuario.

No se guardarán horas locales ambiguas como texto.

---

## 25. Ciclo de vida y eliminación

El ciclo de vida de una entidad deberá distinguir:

- activa;
- inactiva;
- archivada;
- cancelada;
- eliminada lógicamente;
- eliminada permanentemente, cuando sea legal y técnicamente procedente.

El borrado lógico utilizará, cuando aplique:

```text
deleted_at timestamptz null
```

Reglas:

- las consultas operativas excluyen registros eliminados;
- unicidad activa puede usar índices parciales;
- restaurar exige validar conflictos;
- transacciones críticas no se “eliminan” para corregir errores;
- eliminación permanente requiere autorización y retención cumplida.

---

## 26. Datos derivados, vistas y proyecciones

Los datos derivados deberán:

- tener fuentes autorizadas;
- declarar latencia;
- poder reconstruirse;
- no aceptar escrituras directas;
- tener propietario.

Opciones:

- vistas;
- vistas materializadas;
- tablas de proyección;
- funciones de lectura;
- índices especializados.

Los saldos materializados son proyecciones operativas. Los movimientos permanecen como evidencia principal.

---

## 27. Eventos y transactional outbox

Cuando una operación deba persistir datos y publicar un evento, se considerará transactional outbox.

```text
transacción
├── cambio de negocio
├── actualización derivada
└── evento en outbox
```

El evento se publicará posteriormente de forma reintentable.

Cada evento deberá incluir:

- identificador;
- tipo;
- versión;
- agregado o entidad;
- organización;
- fecha;
- correlación;
- payload mínimo.

La estrategia completa de integración se define en `integration-architecture.md`.

---

## 28. Auditoría

La auditoría deberá responder:

- quién;
- qué;
- cuándo;
- dónde;
- por qué;
- desde qué operación;
- con qué resultado.

Para cambios sensibles podrá incluir valores anteriores y posteriores.

La auditoría no sustituye logs técnicos.

Acciones prioritarias:

- permisos;
- ajustes;
- aprobaciones;
- bloqueos y liberaciones;
- exportaciones;
- eliminaciones;
- cambios de configuración;
- uso privilegiado.

---

## 29. Clasificación y protección

| Clasificación | Ejemplos | Tratamiento |
|---|---|---|
| Pública | catálogo publicado | acceso controlado de lectura |
| Interna | configuraciones operativas | usuarios autorizados |
| Confidencial | costos, precios, proveedores | mínimo privilegio y auditoría |
| Sensible | datos personales, secretos, evidencia crítica | protección reforzada |

Los datos deberán recopilarse y conservarse según necesidad, propósito y política de retención.

Los detalles de seguridad se definen en `security-architecture.md`.

---

## 30. Row Level Security

RLS estará habilitado en tablas expuestas mediante Supabase.

Las políticas deberán:

- verificar `auth.uid()`;
- comprobar membresía activa;
- aplicar organización, sucursal o almacén;
- separar lectura, inserción, actualización y eliminación;
- ser probadas con casos permitidos y denegados;
- evitar políticas abiertas como solución temporal permanente.

El siguiente esquema es conceptual. Los nombres físicos de tablas, columnas y alcances deberán alinearse con la arquitectura multi-tenant y el ADR correspondiente.

Ejemplo conceptual:

```sql
using (
  organization_id in (
    select organization_id
    from user_organizations
    where user_id = auth.uid()
      and is_active = true
  )
)
```

---

## 31. Acceso mediante Supabase

Reglas:

- clientes browser y server claramente separados;
- service role únicamente en backend seguro;
- consultas encapsuladas en repositorios o gateways;
- errores del proveedor traducidos;
- RLS como control de defensa en profundidad;
- migraciones como fuente del esquema;
- Storage protegido mediante políticas y rutas controladas.

El SDK de Supabase no deberá convertirse en contrato del dominio.

No se accederá directamente desde cualquier componente a tablas críticas.

---

## 32. Funciones, triggers y procedimientos

Se utilizarán cuando una operación requiera:

- atomicidad;
- protección frente a concurrencia;
- asignación secuencial;
- validación cercana a los datos;
- menor número de viajes;
- mantenimiento de una proyección crítica.

Toda función deberá:

- estar versionada;
- tener contrato;
- validar el contexto de seguridad;
- documentar efectos;
- devolver errores interpretables;
- incluir pruebas.

Los triggers serán mínimos y explícitos. No deberán ocultar procesos de negocio complejos.

---

## 33. Migraciones y esquema como código

Toda modificación de esquema deberá existir como migración versionada.

Reglas:

- no editar producción manualmente;
- no modificar migraciones aplicadas;
- mantener orden reproducible;
- probar en un entorno no productivo;
- separar cambios destructivos;
- documentar recuperación;
- actualizar tipos y repositorios relacionados.

El repositorio será la referencia del esquema esperado.

---

## 34. Baseline y prevención de deriva

La plataforma deberá poder construir una base nueva desde cero utilizando migraciones y seeds obligatorios.

Se aplicarán controles para detectar:

- objetos presentes en producción pero ausentes en Git;
- migraciones faltantes;
- cambios manuales;
- políticas RLS distintas;
- funciones o índices no versionados.

La comparación de esquema podrá automatizarse en CI cuando el proceso madure.

---

## 35. Compatibilidad de cambios

Los cambios incompatibles seguirán una estrategia expand-contract.

### Expand

Agregar estructura compatible.

### Migrate

Copiar, transformar o poblar datos.

### Switch

Mover consumidores gradualmente.

### Contract

Retirar estructura anterior después de verificar que ya no se utiliza.

Renombrar o eliminar una columna en un solo despliegue no será la estrategia predeterminada.

---

## 36. Datos semilla y pruebas

Los seeds se clasificarán en:

- obligatorios;
- desarrollo;
- demostración;
- pruebas.

Reglas:

- seeds obligatorios idempotentes;
- datos de demostración nunca en producción por accidente;
- fixtures pequeños y legibles;
- pruebas de RLS con múltiples organizaciones y roles;
- pruebas transaccionales para operaciones críticas;
- pruebas de migración con datos existentes.

---

## 37. Rendimiento e índices

Los índices se crearán con base en consultas reales.

Candidatos frecuentes:

- `organization_id`;
- claves foráneas;
- estados activos;
- fechas;
- producto, almacén y ubicación;
- lote y caducidad;
- documentos origen;
- claves de idempotencia.

Se observarán:

- consultas lentas;
- scans completos;
- N+1;
- locks;
- contención;
- crecimiento de tablas e índices;
- índices no usados.

La estrategia completa de rendimiento se define en `performance-architecture.md`.

---

## 38. Calidad de datos

Se vigilarán:

- duplicados;
- valores faltantes;
- referencias inválidas;
- estados imposibles;
- saldos inconsistentes;
- fechas contradictorias;
- unidades incompatibles;
- datos fuera de alcance organizacional.

Las reglas críticas se automatizarán mediante restricciones, consultas de control y reconciliaciones.

Una incidencia de calidad deberá producir evidencia y acción correctiva.

---

## 39. Observabilidad de datos

Se monitorearán:

- errores de base de datos;
- fallos de migración;
- rechazos RLS;
- consultas lentas;
- conexiones;
- locks;
- crecimiento;
- jobs atrasados;
- outbox pendiente;
- reconciliaciones fallidas;
- restauraciones probadas.

La telemetría general se define en `observability-architecture.md`.

---

## 40. Respaldo y recuperación

La estrategia deberá definir:

- frecuencia;
- retención;
- cifrado;
- responsables;
- ubicación;
- restauración;
- pruebas;
- RPO y RTO por capacidad crítica.

Un respaldo no será confiable hasta que se haya restaurado con éxito.

Los procedimientos deberán contemplar:

- pérdida accidental;
- corrupción;
- despliegue defectuoso;
- eliminación maliciosa;
- indisponibilidad del proveedor.

---

## 41. Retención y privacidad

Cada categoría tendrá una política de retención:

- transacciones;
- auditoría;
- logs;
- archivos;
- exportaciones;
- cuentas inactivas;
- respaldos;
- datos personales.

Conservar indefinidamente no será la opción predeterminada.

La eliminación deberá respetar:

- obligaciones;
- relaciones;
- evidencia;
- archivos asociados;
- y derechos aplicables.

---

## 42. Tipos y contratos de esquema

Los tipos generados desde la base de datos deberán considerarse contratos de infraestructura, no entidades de dominio.

Reglas:

- regenerar tipos después de cambios de esquema;
- revisar diferencias en Pull Request;
- no editar manualmente archivos generados;
- mapear filas hacia modelos de dominio;
- versionar contratos externos;
- evitar `any` para ocultar desalineaciones.

Las APIs y eventos deberán declarar versión y compatibilidad.

---

## 43. Estrategia de migración desde el estado actual

### Etapa 1 — Descubrimiento

- inventariar tablas, funciones, políticas e índices;
- identificar owners;
- mapear accesos directos;
- clasificar criticidad.

### Etapa 2 — Reproducibilidad

- consolidar migraciones;
- confirmar baseline;
- separar seeds;
- reconstruir un entorno limpio.

### Etapa 3 — Integridad crítica

- agregar claves, restricciones e índices;
- proteger inventario y estados;
- corregir datos incompatibles.

### Etapa 4 — Seguridad

- habilitar o corregir RLS;
- probar aislamiento;
- reducir service role;
- documentar permisos.

### Etapa 5 — Encapsulación

- crear repositorios;
- mover consultas desde UI;
- introducir casos de uso;
- traducir errores.

### Etapa 6 — Operación

- reconciliación;
- observabilidad;
- respaldos probados;
- runbooks;
- métricas de calidad.

---

## 44. Antipatrones prohibidos

- editar producción manualmente sin migración;
- usar texto como relación;
- almacenar dinero o cantidades críticas en `float`;
- guardar fechas ambiguas;
- actualizar saldos sin movimiento;
- deshabilitar RLS por comodidad;
- usar service role en cliente;
- duplicar fuentes de verdad;
- borrar historia para corregir errores;
- modificar migraciones aplicadas;
- usar `select *` indiscriminadamente;
- depender de orden implícito;
- ocultar errores de integridad;
- crear triggers con lógica de negocio no documentada;
- introducir columnas sin owner ni propósito.

---

## 45. Definition of Done para cambios de datos

Un cambio está terminado cuando:

- tiene migración versionada;
- protege integridad;
- define owner;
- incluye índices necesarios;
- define o actualiza RLS;
- actualiza tipos;
- actualiza repositorios;
- contempla datos existentes;
- incluye pruebas proporcionales al riesgo;
- documenta recuperación;
- actualiza la documentación y el catálogo de datos aplicable, cuando exista;
- pasa CI;
- fue probado en entorno no productivo;
- y no introduce deriva conocida.

---

## 46. Gobierno

Los cambios se clasificarán por riesgo.

### Bajo

Ejemplos:

- índice no destructivo;
- comentario;
- vista nueva sin consumidores críticos.

Requiere revisión normal y CI.

### Medio

Ejemplos:

- columna nueva;
- restricción sobre datos existentes;
- política RLS modificada;
- backfill acotado.

Requiere plan de verificación y recuperación.

### Alto

Ejemplos:

- eliminación o cambio de tipo;
- migración masiva;
- cambio de ownership;
- operación sobre inventario;
- modificación de tenancy;
- cambio de retención o auditoría.

Requiere diseño previo, revisión reforzada, ejecución controlada y ADR o RFC cuando corresponda.

---

## 47. Decisiones que requieren ADR

Como mínimo:

- modelo definitivo de organizaciones y sucursales;
- ownership de lotes;
- valuación de inventario;
- reservas y ATP;
- auditoría inmutable;
- outbox y publicación de eventos;
- RPO y RTO;
- retención;
- cifrado adicional;
- modelo offline;
- estrategia analítica;
- versionado de recetas y costos;
- separación de una base o servicio.

---

## 48. Criterios de conformidad

Un cambio respeta esta arquitectura cuando:

- representa un hecho del negocio con semántica clara;
- tiene owner;
- usa tipos correctos;
- protege integridad;
- respeta organización y alcance;
- conserva trazabilidad;
- evita escrituras cruzadas sin contrato;
- es compatible o tiene plan de transición;
- puede verificarse y recuperarse;
- actualiza documentación;
- y registra decisiones materiales.

Una excepción deberá ser explícita, justificada y temporal cuando sea posible.

---

## 49. Evolución

La arquitectura de datos evolucionará mediante:

- evidencia operativa;
- incidentes;
- métricas;
- aprendizaje del negocio;
- revisiones de ownership;
- RFC;
- ADR;
- cambios pequeños y compatibles.

El objetivo no es conservar un esquema por orgullo. Es conservar significado, integridad y capacidad de evolución.

La consolidación de este documento no autoriza una migración inmediata. Cada cambio deberá convertirse en trabajo planificado.

---

## 50. Declaración final

> **Los datos de CRUMAFOOD Platform serán tratados como evidencia estructurada de la operación del negocio.**

Cada modelo deberá expresar:

- qué hecho representa;
- quién es su propietario;
- qué reglas lo protegen;
- cómo puede cambiar;
- quién puede acceder;
- cómo se audita;
- y cómo puede recuperarse.

Una arquitectura de datos sólida permitirá que CRUMAFOOD crezca sin perder confiabilidad, trazabilidad, seguridad ni control.
