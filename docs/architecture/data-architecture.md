# Arquitectura de Datos de CRUMAFOOD Platform

> **Los datos representan hechos del negocio. Deben ser correctos, trazables, protegidos y recuperables.**

## Estado del documento

| Campo | Valor |
|---|---|
| Estado | Propuesto para aprobación |
| Versión | 1.0 |
| Propietarios | Product Owner, Arquitectura e Ingeniería de Datos |
| Alcance | Datos operativos, persistencia, integridad, seguridad, auditoría y evolución |
| Autoridad | Derivado de `system-overview.md` y `business-core.md` |
| Revisión | Cuando cambien modelos críticos, políticas de acceso o estrategia de persistencia |

---

## 1. Propósito

Este documento define cómo CRUMAFOOD Platform diseñará, almacenará, protegerá y evolucionará sus datos.

La arquitectura debe asegurar que la información utilizada por Producción, Inventario, Compras, Ventas, Almacenes, Calidad y Costos sea correcta, consistente, trazable, autorizada, recuperable, comprensible y útil para operación y análisis.

PostgreSQL, operado actualmente mediante Supabase, será la fuente de autoridad para el estado transaccional compartido.

---

## 2. Principios de datos

### 2.1 Una fuente de autoridad

Cada dato tendrá un propietario y una ubicación principal. No se mantendrán múltiples versiones editables del mismo hecho sin una estrategia explícita de sincronización.

### 2.2 Integridad por diseño

La integridad no dependerá únicamente de formularios o validaciones visuales. Se protegerá mediante tipos correctos, restricciones, claves, transacciones, políticas y reglas de negocio.

### 2.3 Trazabilidad

Toda operación crítica deberá poder reconstruirse.

### 2.4 Datos mínimos necesarios

Se almacenará únicamente la información necesaria para operar, cumplir obligaciones y mejorar el producto.

### 2.5 Evolución segura

Los cambios de esquema serán versionados, revisados y desplegados de forma controlada.

### 2.6 Separación entre escritura y lectura

El modelo que protege invariantes no tiene que ser idéntico al modelo optimizado para reportes.

---

## 3. Plataforma de persistencia

La plataforma actual utiliza PostgreSQL, Supabase Database, Supabase Auth, Supabase Storage, Row Level Security, migraciones SQL versionadas y clientes server/browser separados.

El dominio no importará el SDK de Supabase. La dependencia del proveedor deberá permanecer encapsulada en adaptadores y repositorios.

---

## 4. Categorías de datos

- **Datos maestros:** productos, categorías, familias, unidades, proveedores, clientes, ubicaciones y recetas.
- **Datos transaccionales:** movimientos, órdenes, recepciones, consumos, pedidos, despachos, pagos e inspecciones.
- **Datos de referencia:** estados, tipos de movimiento, motivos, monedas y unidades.
- **Datos derivados:** saldos, disponibilidad, costos, indicadores y proyecciones.
- **Datos de auditoría:** evidencia de cambios y acciones.
- **Datos analíticos:** proyecciones para reportes y decisiones.

---

## 5. Propiedad por módulo

| Módulo | Datos principales |
|---|---|
| Identity & Access | usuarios, roles, permisos, organizaciones y sucursales |
| Catalog | productos, categorías, familias, unidades y presentaciones |
| Inventory | lotes, movimientos, saldos y reservas |
| Warehouse | almacenes, ubicaciones, conteos y transferencias |
| Production | recetas, órdenes, consumos, rendimientos y mermas |
| Purchasing | proveedores, solicitudes, órdenes y recepciones documentales |
| Sales | clientes, cotizaciones, pedidos y precios |
| Quality | inspecciones, liberaciones, bloqueos e incidencias |
| Costing | reglas, costos, variaciones y periodos |
| Distribution | rutas, despachos y entregas |

Un módulo puede leer datos de otro mediante contratos. No debe modificar sus tablas internas directamente.

---

## 6. Convenciones de tablas

### 6.1 Nombres

- nombres en plural;
- `snake_case`;
- términos del negocio;
- sin abreviaturas ambiguas.

Ejemplos:

```text
products
inventory_movements
production_orders
purchase_order_lines
warehouse_locations
```

### 6.2 Columnas comunes

Cuando corresponda:

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

### 6.3 Identificadores

Los identificadores internos usarán UUID cuando deban generarse en distintos clientes, evitar secuencias predecibles o participar en sincronización.

Los códigos visibles del negocio se almacenarán por separado:

```text
id = 8e7...
internal_code = MP-AGUA
```

---

## 7. Relaciones e integridad referencial

Las relaciones se protegerán mediante claves foráneas.

```sql
product_id uuid not null references products(id)
```

Reglas:

- evitar relaciones por texto;
- definir comportamiento de borrado;
- no usar `ON DELETE CASCADE` en datos críticos sin justificación;
- indexar claves foráneas utilizadas frecuentemente;
- impedir referencias a registros incompatibles.

---

## 8. Restricciones

PostgreSQL protegerá invariantes estructurales mediante `NOT NULL`, `UNIQUE`, `CHECK`, claves foráneas e índices únicos parciales.

Ejemplos:

```sql
quantity > 0
unit_cost >= 0
expiration_date >= production_date
```

La aplicación también validará para ofrecer mensajes comprensibles.

---

## 9. Fechas y tiempo

- Los eventos con hora se almacenarán como `timestamptz`.
- Las fechas de negocio sin hora se almacenarán como `date`.
- La presentación utilizará la zona horaria de la organización o usuario.
- No se guardarán horas locales ambiguas como texto.

Ejemplos de fecha de negocio: caducidad, producción, fecha prometida y periodo contable.

---

## 10. Cantidades, unidades y dinero

Las cantidades utilizarán tipos numéricos exactos, por ejemplo:

```sql
quantity numeric(18,6)
```

Cada cantidad deberá tener una unidad inequívoca. Las conversiones declararán factor, dirección, precisión y redondeo.

Los importes utilizarán `numeric`, no `float`. Toda operación monetaria deberá indicar moneda y reglas de redondeo.

---

## 11. Borrado lógico

El borrado lógico se utilizará cuando sea necesario preservar historia o referencias.

```text
deleted_at timestamptz null
```

Reglas:

- las consultas operativas excluirán registros eliminados;
- los índices únicos considerarán `deleted_at is null` cuando aplique;
- no se reutilizarán identificadores históricos;
- restaurar requerirá validación;
- los errores transaccionales se corregirán mediante reversión o movimientos compensatorios.

Ejemplo:

```sql
create unique index categories_name_active_unique
on categories (lower(name))
where deleted_at is null;
```

---

## 12. Inventario basado en movimientos

El saldo no será la única fuente de verdad. La fuente principal será el registro de movimientos.

Cada movimiento deberá incluir, según corresponda:

- producto;
- cantidad;
- unidad;
- tipo;
- ubicación;
- lote;
- documento origen;
- motivo;
- actor;
- fecha efectiva;
- fecha de registro;
- clave de idempotencia.

Ejemplo:

```text
Entrada +100
Salida -20
Ajuste -2
Saldo = 78
```

El saldo podrá mantenerse materializado por rendimiento, pero deberá poder reconciliarse.

---

## 13. Saldos

Un saldo representa una proyección operativa por organización, almacén, ubicación, producto, lote y estado de calidad.

Reglas:

- actualización atómica con el movimiento;
- nunca editar manualmente sin movimiento compensatorio;
- reconciliación periódica;
- protección contra cantidades negativas según política;
- control de concurrencia mediante versión, bloqueo o actualización condicional.

---

## 14. Lotes y FEFO

Un lote deberá permitir rastrear producto, código, fechas, proveedor u origen, orden de producción, estado de calidad, cantidades, ubicaciones y movimientos relacionados.

FEFO seleccionará primero el lote utilizable con caducidad más próxima.

La política excluirá lotes bloqueados, vencidos, sin existencia, no disponibles, reservados o incompatibles con el contexto.

El resultado de una asignación FEFO deberá ser reproducible y auditable.

---

## 15. Reservas

Las reservas separarán:

```text
existencia física
existencia reservada
existencia disponible
```

Regla conceptual:

```text
disponible = física - reservada - bloqueada
```

Una reserva deberá incluir origen, cantidad, estado, actor, entidad relacionada y vencimiento cuando aplique.

---

## 16. Producción

Las órdenes de producción preservarán:

- receta y versión;
- cantidades planeadas y reales;
- lotes consumidos y generados;
- mermas;
- rendimientos;
- responsables;
- marcas de tiempo;
- evidencia de calidad.

Cambiar una receta posteriormente no deberá alterar la historia.

---

## 17. Compras, ventas y calidad

### Compras

El flujo separará orden aprobada, recepción física, inspección, aceptación y movimiento de inventario.

### Ventas

Los pedidos separarán cantidad solicitada, reservada, preparada, despachada, entregada y cancelada.

### Calidad

Calidad podrá liberar, bloquear, rechazar o condicionar lotes sin borrar movimientos históricos.

---

## 18. Auditoría

La auditoría deberá responder:

- quién;
- qué;
- cuándo;
- dónde;
- por qué;
- desde qué operación;
- cuál era el valor anterior;
- cuál fue el nuevo valor.

No todas las tablas requieren captura completa de antes y después. Las operaciones críticas sí.

---

## 19. Eventos y transactional outbox

Cuando una operación deba persistir datos y publicar un evento, se considerará transactional outbox.

```text
transacción
├── cambio de negocio
├── actualización derivada
└── evento en outbox
```

Un procesador posterior publicará el evento sin perder consistencia.

---

## 20. Idempotencia

Las operaciones críticas aceptarán una clave de idempotencia.

Ejemplos:

- recepción;
- movimiento;
- consumo;
- producción terminada;
- sincronización móvil;
- integración externa.

La misma intención no deberá ejecutarse dos veces.

---

## 21. Concurrencia y transacciones

Se elegirá una estrategia según el caso:

- transacción;
- bloqueo de fila;
- actualización condicional;
- columna `version`;
- restricción única;
- advisory lock;
- función PostgreSQL.

Las escrituras relacionadas deberán ejecutarse en una misma transacción cuando un fallo intermedio pueda dejar datos inválidos.

---

## 22. Funciones PostgreSQL

Se utilizarán para operaciones atómicas, sensibles a concurrencia o que requieran garantías cercanas a los datos.

Toda función deberá:

- estar versionada;
- tener pruebas;
- operar en un contexto autorizado;
- definir errores;
- documentar efectos.

---

## 23. Row Level Security

RLS deberá estar habilitado en tablas expuestas.

Las políticas considerarán usuario, organización, sucursal, almacén, rol, estado y propiedad del registro.

No se confiará en `organization_id` enviado por el cliente sin verificación.

La `service_role` solo se utilizará en backend seguro y no será la solución predeterminada para evitar RLS.

---

## 24. Datos personales y sensibles

Los datos se clasificarán como públicos, internos, confidenciales o sensibles.

La información sensible requerirá acceso mínimo, protección, auditoría, retención definida y eliminación controlada.

---

## 25. Archivos

Supabase Storage almacenará imágenes, documentos, evidencia, importaciones y reportes.

La base de datos almacenará metadatos:

```text
bucket
object_path
mime_type
size
checksum
owner
created_at
```

No se almacenarán URLs temporales como fuente permanente.

---

## 26. Modelos de lectura y reportes

Los modelos de lectura podrán utilizar vistas, vistas materializadas, tablas de proyección, consultas especializadas e índices.

Deben:

- derivar de fuentes autorizadas;
- poder reconstruirse;
- declarar latencia;
- no aceptar escrituras directas.

Los reportes no deberán poner en riesgo la operación transaccional.

---

## 27. Índices y rendimiento

Los índices se crearán con base en consultas reales.

Candidatos frecuentes:

- claves foráneas;
- organización;
- estados activos;
- fechas;
- producto y almacén;
- lote y caducidad;
- documentos origen;
- claves de idempotencia.

Se observarán consultas lentas, scans completos, N+1, bloqueos, contención, crecimiento e índices no usados.

---

## 28. Migraciones

Toda modificación de esquema deberá existir como migración versionada.

Reglas:

- no editar producción manualmente;
- no modificar migraciones ya aplicadas;
- una migración debe funcionar en entornos nuevos;
- separar cambios destructivos;
- probar con datos representativos;
- documentar recuperación.

---

## 29. Estrategia expand-contract

Los cambios incompatibles se realizarán por etapas:

1. **Expand:** agregar estructura compatible.
2. **Migrate:** transformar datos.
3. **Switch:** mover consumidores.
4. **Contract:** retirar estructura anterior.

---

## 30. Backfills y datos semilla

Todo backfill deberá definir alcance, lotes, reanudación, idempotencia, validación, monitoreo y recuperación.

Los seeds se clasificarán en obligatorios, demostración, desarrollo y pruebas.

Los datos obligatorios deberán ser idempotentes.

---

## 31. Entornos

Los entornos principales serán local, preview, staging cuando exista y production.

Cada entorno tendrá base, secretos, políticas y datos separados.

No se copiarán datos personales de producción a desarrollo sin anonimización.

---

## 32. Respaldos y recuperación

La estrategia deberá definir frecuencia, retención, cifrado, responsables, ubicación, restauración y pruebas.

Un respaldo no es confiable hasta que se prueba su restauración.

Para capacidades críticas se definirán RPO, RTO, procedimiento y responsables.

---

## 33. Retención y eliminación

Cada categoría de datos tendrá una política de retención.

La eliminación permanente será excepcional en datos transaccionales y deberá estar autorizada, respetar retención, conservar evidencia y evitar referencias rotas.

---

## 34. Importaciones y exportaciones

Las importaciones seguirán:

```text
cargar
validar
previsualizar
aprobar
aplicar
auditar
```

Las exportaciones deberán respetar permisos, alcance y protección de datos sensibles.

---

## 35. Calidad y reconciliación

Se observarán duplicados, valores faltantes, referencias inválidas, estados imposibles, saldos inconsistentes, fechas contradictorias y unidades incompatibles.

Se crearán procesos para reconciliar movimientos contra saldos, recepciones contra inventario, producción contra consumos y pedidos contra reservas y despachos.

---

## 36. Documentación y catálogo de datos

Cada tabla crítica documentará propósito, propietario, columnas, restricciones, índices, relaciones, RLS, retención, eventos y casos de uso.

Estructura sugerida:

```text
docs/data/
├── catalog.md
├── inventory.md
├── production.md
├── purchasing.md
└── sales.md
```

---

## 37. Definition of Done para cambios de datos

Un cambio está terminado cuando:

- tiene migración;
- protege integridad;
- incluye índices necesarios;
- define RLS;
- actualiza tipos y repositorios;
- incluye pruebas;
- contempla datos existentes;
- documenta recuperación;
- actualiza documentación;
- pasa CI;
- fue probado fuera de producción.

---

## 38. Antipatrones prohibidos

- editar producción sin migración;
- usar texto como relación;
- almacenar dinero en `float`;
- guardar fechas ambiguas;
- actualizar saldos sin movimiento;
- deshabilitar RLS para resolver permisos;
- usar service role en cliente;
- duplicar fuentes de verdad;
- borrar historia para corregir errores;
- modificar migraciones aplicadas;
- usar `select *` indiscriminadamente;
- depender de orden implícito;
- ocultar errores de integridad.

---

## 39. Decisiones pendientes

Requieren ADR o RFC:

- modelo definitivo de organización y sucursal;
- propiedad de lotes;
- estrategia de valuación;
- reservas;
- auditoría;
- eventos y outbox;
- retención;
- RPO y RTO;
- estrategia analítica;
- modelo offline;
- cifrado adicional;
- versionado de recetas y costos.

---

## 40. Roadmap de implementación

### Fase 1 — Fundamentos

Convenciones, migraciones, RLS, restricciones y propiedad por módulo.

### Fase 2 — Inventario confiable

Movimientos, saldos, lotes, reconciliación e idempotencia.

### Fase 3 — Producción trazable

Recetas versionadas, consumos, terminados, rendimientos y mermas.

### Fase 4 — Integración operacional

Compras, ventas, calidad, reservas y despachos.

### Fase 5 — Analítica y resiliencia

Proyecciones, monitoreo, respaldos, recuperación y retención.

---

## 41. Declaración final

> **Los datos de CRUMAFOOD Platform no serán tratados como registros aislados, sino como evidencia estructurada de la operación del negocio.**

Cada modelo deberá expresar qué hecho representa, quién es su propietario, qué reglas lo protegen, cómo puede cambiar, quién puede acceder y cómo puede recuperarse.

Una arquitectura de datos sólida permitirá que la plataforma crezca sin perder confiabilidad, trazabilidad ni control.
