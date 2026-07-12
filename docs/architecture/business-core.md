# Arquitectura del Business Core

> **El negocio es el centro de la plataforma. Las interfaces y los proveedores son reemplazables; las reglas del negocio no.**

## Estado del documento

| Campo | Valor |
|---|---|
| Estado | Propuesto para aprobación |
| Versión | 1.0 |
| Propietarios | Product Owner y responsable de arquitectura |
| Alcance | Núcleo de negocio, límites modulares, dependencias y contratos |
| Autoridad | Derivado de `system-overview.md`, la Constitución y los Principios del CES |
| Revisión | Cuando cambien límites de módulos, contratos o dirección de dependencias |

---

## 1. Propósito

Este documento define cómo debe organizarse el **Business Core** de CRUMAFOOD Platform.

El Business Core contiene las capacidades que expresan el negocio de manufactura y distribución de alimentos:

- catálogo;
- inventario;
- producción;
- compras;
- ventas;
- almacenes;
- calidad;
- costos;
- distribución;
- identidad y autorización de negocio.

Su propósito es evitar que las reglas críticas terminen dispersas entre páginas, formularios, componentes React, Server Actions, consultas directas a Supabase, funciones SQL aisladas o integraciones específicas.

---

## 2. Definición

El Business Core es el conjunto de módulos que representan:

- conceptos del negocio;
- reglas;
- invariantes;
- casos de uso;
- contratos;
- eventos;
- y decisiones operativas.

No es una sola carpeta genérica ni una librería de utilidades.

Cada módulo debe tener responsabilidad clara, lenguaje propio y propiedad explícita sobre sus datos.

---

## 3. Principio rector

> **Una regla de negocio debe tener una ubicación principal, una autoridad clara y una forma verificable de ejecutarse.**

La misma regla no deberá implementarse de manera diferente en Desktop, Web y Mobile.

Ejemplo: la validación de que un lote no puede consumirse si está bloqueado por Calidad pertenece al núcleo de negocio. No pertenece al formulario de producción, al botón de consumo ni a una pantalla móvil aislada.

---

## 4. Arquitectura interna de un módulo

```text
modules/
└── inventory/
    ├── domain/
    │   ├── entities/
    │   ├── value-objects/
    │   ├── policies/
    │   ├── services/
    │   ├── events/
    │   ├── errors/
    │   └── ports/
    ├── application/
    │   ├── commands/
    │   ├── queries/
    │   ├── use-cases/
    │   ├── dto/
    │   └── mappers/
    ├── infrastructure/
    │   ├── repositories/
    │   ├── supabase/
    │   └── persistence/
    ├── presentation/
    │   ├── actions/
    │   ├── controllers/
    │   └── view-models/
    ├── tests/
    └── README.md
```

Esta estructura puede simplificarse en módulos pequeños. No se crearán carpetas vacías únicamente para imitar una arquitectura.

---

## 5. Responsabilidades por capa

### 5.1 Domain

Contiene entidades, objetos de valor, invariantes, políticas, servicios de dominio, eventos, errores del negocio y puertos necesarios para expresar el negocio.

No contiene Supabase, SQL, React, Next.js, Tauri, HTTP, variables de entorno ni formatos visuales.

### 5.2 Application

Coordina casos de uso como:

- registrar un movimiento de inventario;
- aprobar una orden de compra;
- iniciar una orden de producción;
- confirmar un pedido;
- liberar un lote;
- cerrar un conteo físico.

Puede autorizar, cargar datos, invocar el dominio, coordinar transacciones, persistir, publicar eventos y devolver DTO estables.

### 5.3 Infrastructure

Implementa puertos mediante tecnologías concretas:

- Supabase;
- PostgreSQL;
- almacenamiento;
- correo;
- impresoras;
- proveedores externos;
- reloj;
- generación de identificadores.

### 5.4 Presentation

Adapta las interfaces al lenguaje de aplicación:

- Server Actions;
- route handlers;
- controladores;
- view models;
- mapeo de errores;
- composición de respuestas.

No contiene reglas esenciales.

---

## 6. Dirección de dependencias

```text
presentation ──► application ──► domain
                         │
                         └────► ports
                                  ▲
                                  │
                           infrastructure
```

Reglas:

1. `domain` no depende de ninguna capa externa.
2. `application` depende del dominio y de contratos.
3. `infrastructure` implementa contratos.
4. `presentation` invoca casos de uso.
5. Las aplicaciones componen módulos, pero no gobiernan sus reglas.

---

## 7. Módulos oficiales del núcleo

### 7.1 Catalog

Propietario de productos, categorías, familias, sabores, presentaciones, unidades base, estados de catálogo y atributos operativos.

No será propietario de existencias.

### 7.2 Inventory

Propietario de movimientos, saldos, lotes desde la perspectiva de inventario, reservas, disponibilidad y ajustes.

Invariantes principales:

- no duplicar movimientos;
- mantener cantidades coherentes;
- respetar unidades;
- impedir consumos inválidos;
- registrar causa y origen.

### 7.3 Warehouse

Propietario de almacenes, ubicaciones, recepción física, transferencias, picking, conteos y asignación operativa de posiciones.

Inventory determina existencias. Warehouse determina dónde y cómo se operan físicamente.

### 7.4 Production

Propietario de recetas, versiones, órdenes, consumos planeados y reales, rendimientos, mermas y terminados.

No escribe saldos directamente. Solicita a Inventory registrar movimientos.

### 7.5 Purchasing

Propietario de proveedores, solicitudes, órdenes de compra, condiciones, aprobaciones y compromisos de compra.

Warehouse registra la recepción física. Inventory registra el impacto cuantitativo.

### 7.6 Sales

Propietario de clientes, cotizaciones, pedidos, condiciones comerciales, precios y compromisos.

Inventory podrá reservar existencias por pedido. Distribution gestionará despacho y entrega.

### 7.7 Quality

Propietario de especificaciones, inspecciones, liberaciones, bloqueos, incidencias, evidencia y disposición de producto.

Quality puede autorizar o bloquear operaciones sobre lotes. No altera existencias por sí mismo.

### 7.8 Costing

Propietario de reglas de costeo, costos estándar, costos reales, variaciones y componentes de costo.

Consume información de compras, inventario y producción sin sustituir sus fuentes de verdad.

### 7.9 Distribution

Propietario de preparación de despacho, rutas, entregas, confirmaciones e incidencias de distribución.

### 7.10 Identity & Access

Propietario de usuarios internos, organizaciones, sucursales, roles, permisos, alcance operativo y asignaciones.

El proveedor de autenticación no define por sí solo la autorización del negocio.

---

## 8. Propiedad de datos

| Dato | Propietario |
|---|---|
| Nombre y clasificación de producto | Catalog |
| Saldo disponible | Inventory |
| Ubicación física | Warehouse |
| Estado de orden de producción | Production |
| Estado de orden de compra | Purchasing |
| Estado de pedido | Sales |
| Liberación de lote | Quality |
| Costo estándar | Costing |
| Estado de entrega | Distribution |

Otros módulos podrán leer datos mediante contratos. No podrán modificarlos libremente.

---

## 9. Contratos entre módulos

```ts
export interface InventoryCommandPort {
  registerMovement(command: RegisterInventoryMovementCommand): Promise<void>;
  reserveStock(command: ReserveStockCommand): Promise<ReservationResult>;
  releaseReservation(command: ReleaseReservationCommand): Promise<void>;
}
```

Un contrato debe:

- expresar intención;
- evitar detalles de almacenamiento;
- utilizar nombres del negocio;
- ser pequeño;
- ser versionable;
- y tener errores definidos.

---

## 10. Casos de uso

```ts
export interface CompleteProductionOrder {
  execute(
    command: CompleteProductionOrderCommand
  ): Promise<CompleteProductionOrderResult>;
}
```

Un caso de uso debe:

- tener una intención única;
- validar autorización;
- coordinar reglas;
- ejecutar de forma consistente;
- devolver resultado explícito;
- registrar evidencia;
- evitar efectos secundarios ocultos.

---

## 11. Comandos y consultas

Los comandos cambian estado:

- `CreateProduct`;
- `RegisterInventoryMovement`;
- `ApprovePurchaseOrder`;
- `StartProductionOrder`;
- `ReleaseLot`;
- `ConfirmSalesOrder`.

Las consultas leen estado sin modificarlo:

- `GetProduct`;
- `ListAvailableStock`;
- `GetProductionOrder`;
- `ListPurchaseOrders`;
- `GetLotTraceability`.

Una consulta no deberá producir mutaciones ocultas.

---

## 12. Entidades y objetos de valor

Una entidad posee identidad y ciclo de vida.

```ts
class ProductionOrder {
  private status: ProductionOrderStatus;

  start(): void {
    if (!this.status.canStart()) {
      throw new InvalidProductionOrderTransitionError();
    }

    this.status = ProductionOrderStatus.inProgress();
  }
}
```

Un objeto de valor representa un concepto sin identidad propia.

Ejemplos:

- cantidad;
- unidad;
- dinero;
- fecha de caducidad;
- código interno;
- porcentaje de merma;
- número de lote.

```ts
class Quantity {
  constructor(
    readonly value: number,
    readonly unit: UnitOfMeasure
  ) {
    if (value < 0) {
      throw new InvalidQuantityError();
    }
  }
}
```

---

## 13. Servicios y políticas de dominio

Se utilizarán servicios de dominio cuando una regla involucre varias entidades y no pertenezca naturalmente a una sola.

```ts
class FefoAllocationPolicy {
  allocate(
    request: AllocationRequest,
    lots: AvailableLot[]
  ): AllocationResult {
    // Regla FEFO
  }
}
```

Las políticas deberán recibir datos explícitos y no consultar infraestructura directamente.

---

## 14. Eventos de dominio

```ts
type InventoryMovementRecorded = {
  eventId: string;
  movementId: string;
  productId: string;
  quantity: number;
  unit: string;
  occurredAt: string;
};
```

Reglas:

- nombre en pasado;
- identificador único;
- fecha de ocurrencia;
- datos mínimos suficientes;
- sin referencias a UI;
- sin secretos.

---

## 15. Errores de dominio

Ejemplos:

- `InsufficientStockError`;
- `LotBlockedError`;
- `InvalidProductionOrderTransitionError`;
- `PurchaseOrderAlreadyApprovedError`;
- `ProductInactiveError`.

No se utilizará `throw new Error("Algo salió mal")` cuando el negocio conozca la causa.

---

## 16. Repositorios

```ts
export interface ProductionOrderRepository {
  findById(id: ProductionOrderId): Promise<ProductionOrder | null>;
  save(order: ProductionOrder): Promise<void>;
}
```

Un repositorio no expone SQL, cliente Supabase, nombres de tablas ni filtros arbitrarios.

---

## 17. Agregados, consistencia y transacciones

Un agregado define una frontera de consistencia y debe mantenerse pequeño.

Ejemplos posibles:

- `ProductionOrder`;
- `PurchaseOrder`;
- `SalesOrder`;
- `InventoryReservation`.

Las transacciones pertenecen a la coordinación de aplicación o infraestructura.

```ts
await transaction.run(async () => {
  await inventoryRepository.saveMovement(movement);
  await inventoryRepository.updateBalance(balance);
  await outboxRepository.append(event);
});
```

Las operaciones atómicas deberán incluir todos los cambios necesarios para preservar consistencia.

---

## 18. Idempotencia

Los comandos críticos deberán considerar reintentos.

Ejemplos:

- recepción;
- movimiento;
- consumo;
- producción terminada;
- aprobación;
- despacho;
- sincronización móvil.

Una clave de idempotencia debe identificar una intención, ser única en su alcance, conservar el resultado e impedir duplicación.

---

## 19. Validación

### Formato

Campos requeridos, UUID, longitud y formato numérico.

### Regla de negocio

Producto activo, transición válida, lote liberado y stock suficiente.

### Integridad estructural

Claves foráneas, unicidad, no nulos y restricciones de rango.

Las tres capas se complementan.

---

## 20. Autorización de casos de uso

```ts
authorization.require({
  actor,
  permission: "inventory.movement.create",
  scope: {
    organizationId,
    warehouseId,
  },
});
```

Los permisos deberán expresar acción, recurso, alcance y contexto.

---

## 21. DTO y modelos de presentación

El dominio no se enviará directamente a la interfaz.

```ts
type InventoryMovementResult = {
  id: string;
  productId: string;
  quantity: number;
  unit: string;
  balanceAfter: number;
  recordedAt: string;
};
```

Esto permite cambiar persistencia, entidades, interfaz y transporte sin romper contratos.

---

## 22. Mapeo de persistencia

```ts
class SupabaseProductMapper {
  static toDomain(row: ProductRow): Product {
    return Product.restore({
      id: ProductId.from(row.id),
      name: ProductName.from(row.name),
      status: ProductStatus.from(row.status),
    });
  }
}
```

Las filas de base de datos no serán entidades de dominio.

---

## 23. Integración con Supabase

Supabase seguirá siendo la infraestructura principal.

Reglas:

- acceso centralizado;
- clientes server y browser separados;
- service role solo en backend seguro;
- RLS activa;
- errores traducidos;
- consultas encapsuladas;
- transacciones críticas en PostgreSQL;
- migraciones versionadas.

---

## 24. Integración con Next.js

Las rutas y páginas serán composición.

```ts
export default async function InventoryPage() {
  const query = compositionRoot.inventory.listInventory();
  const data = await query.execute();

  return <InventoryView data={data} />;
}
```

Una Server Action será un adaptador:

```ts
export async function registerMovementAction(formData: FormData) {
  const command = mapFormDataToCommand(formData);
  return compositionRoot.inventory.registerMovement().execute(command);
}
```

No deberá contener la lógica completa del caso de uso.

---

## 25. Composition Root

La creación de dependencias deberá concentrarse.

```ts
export const compositionRoot = {
  inventory: {
    registerMovement() {
      const client = createServerSupabaseClient();
      const repository =
        new SupabaseInventoryMovementRepository(client);

      return new RegisterInventoryMovementUseCase(repository);
    },
  },
};
```

Esto evita crear dependencias arbitrariamente en toda la aplicación.

---

## 26. Estrategia de pruebas

### Dominio

Pruebas rápidas y puras de transiciones, FEFO, unidades, estados, cálculos e invariantes.

### Aplicación

Pruebas de casos de uso con puertos simulados.

### Infraestructura

Pruebas contra PostgreSQL o Supabase en entorno controlado.

### Integración

Pruebas completas de operaciones críticas.

La distribución dependerá del riesgo.

---

## 27. Migración desde el código actual

La migración será progresiva.

1. identificar una operación concreta;
2. extraer validación y reglas;
3. crear comando y caso de uso;
4. crear puerto de repositorio;
5. mover Supabase a un adaptador;
6. convertir la Server Action en adaptador;
7. agregar pruebas;
8. documentar la decisión.

No se migrarán todos los módulos simultáneamente.

---

## 28. Ejemplo de migración

### Antes

```ts
export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name"));

  const { error } = await supabase
    .from("products")
    .insert({ name });

  if (error) throw error;
}
```

### Después

```ts
export async function createProductAction(formData: FormData) {
  const command = CreateProductCommand.fromFormData(formData);

  return compositionRoot.catalog
    .createProduct()
    .execute(command);
}
```

---

## 29. Antipatrones prohibidos

- reglas de negocio en componentes;
- Supabase desde cualquier componente;
- estados representados por strings libres;
- servicios gigantes;
- carpetas `shared` sin propiedad;
- escritura directa entre módulos;
- errores capturados y silenciados;
- funciones con efectos secundarios ocultos;
- duplicación de reglas entre clientes.

---

## 30. Criterios para crear un módulo

Un nuevo módulo se justifica cuando existe:

- lenguaje propio;
- reglas propias;
- datos con propiedad clara;
- ciclo de vida independiente;
- capacidad reconocible por el negocio;
- necesidad de proteger límites.

No se crea un módulo por cada tabla.

---

## 31. Criterios para dividir un módulo

Se considera una división cuando:

- el lenguaje se vuelve ambiguo;
- aparecen ciclos internos;
- dos partes cambian por razones distintas;
- la propiedad de datos no es clara;
- el módulo pierde cohesión;
- equipos distintos necesitan autonomía real.

---

## 32. Compatibilidad multiplataforma

El Business Core debe funcionar sin depender de navegador, sistema operativo, Tauri, React Native, Next.js, DOM o almacenamiento local.

Las interfaces podrán ser distintas. Las reglas deberán ser las mismas.

---

## 33. Métricas de salud arquitectónica

Se observarán:

- reglas duplicadas;
- accesos directos a Supabase;
- ciclos entre módulos;
- archivos con demasiadas responsabilidades;
- casos de uso sin pruebas;
- cambios que afectan módulos no relacionados;
- fallos por inconsistencia;
- decisiones no documentadas;
- tiempo de incorporación de nuevos desarrolladores.

---

## 34. Definition of Done para un caso de uso

Un caso de uso está terminado cuando:

- resuelve la necesidad aprobada;
- tiene nombre del negocio;
- respeta propiedad modular;
- valida autorización;
- protege invariantes;
- coordina transacción si aplica;
- maneja errores;
- es idempotente si puede reintentarse;
- registra evidencia;
- tiene pruebas proporcionales al riesgo;
- actualiza documentación;
- no expone detalles del proveedor.

---

## 35. Decisiones pendientes

Requieren ADR o RFC:

- límites definitivos entre Inventory y Warehouse;
- propiedad y ciclo de vida de lotes;
- modelo de unidades y conversiones;
- reserva de inventario;
- valuación;
- diseño de eventos;
- composition root;
- estrategia de transacciones;
- estructura final del monorepositorio;
- sincronización offline.

---

## 36. Declaración final

> **El Business Core será el activo técnico más valioso de CRUMAFOOD Platform.**

Su calidad no se medirá por cantidad de clases ni patrones aplicados.

Se medirá por su capacidad para representar correctamente el negocio, proteger invariantes, permitir cambios seguros, reutilizar reglas entre clientes y mantener independencia frente a tecnologías reemplazables.

Cada módulo deberá ser comprensible, verificable y responsable de una capacidad concreta.

Ese será el fundamento para construir Desktop, Mobile, Web e integraciones sobre una sola verdad de negocio.
