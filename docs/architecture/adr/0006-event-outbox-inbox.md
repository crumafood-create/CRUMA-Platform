# ADR-0006: Adoptar eventos de integración con outbox e inbox transaccionales

> **Propuesta:** publicar hechos de negocio mediante transactional outbox en PostgreSQL y consumirlos con inbox idempotente, asumiendo entrega al menos una vez.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-07-12 |
| Decisores | Product Owner, responsable de arquitectura, responsable de integración y responsable de datos |
| Consultados | Seguridad, responsables de módulos, operación, Mobile, Desktop y calidad |
| Informados | Desarrollo, soporte y responsables de proveedores externos |
| Propietario | Arquitectura de Integración con corresponsabilidad de Datos |
| Alcance | Eventos, outbox, inbox, publisher, consumers, ordering, retries, dead letters, webhooks y sync |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; requiere vertical slice antes de aceptación |
| Issues relacionados | Pendiente: tablas outbox/inbox, publisher, catálogo de eventos y consumer piloto |

---

## 1. Resumen ejecutivo

CRUMAFOOD necesita propagar hechos después de transacciones sin perder mensajes ni duplicar efectos.

Publicar directamente después de un commit deja una ventana donde el dato se guarda pero el mensaje se pierde. Publicar antes del commit puede anunciar un hecho que nunca ocurrió.

La decisión propuesta es:

> **Los eventos de integración que deban ser consistentes con una escritura se persisten en una outbox dentro de la misma transacción PostgreSQL. Un publisher separado los entrega al menos una vez y cada consumidor usa inbox e idempotencia.**

No se incorpora un broker externo hasta que exista una necesidad operativa demostrable.

---

## 2. Contexto

La plataforma requiere eventos para:

- proyecciones;
- notificaciones;
- webhooks;
- integraciones;
- automatizaciones;
- auditoría derivada;
- jobs;
- y sincronización offline.

El repositorio contiene intención de event bus, pero no existe infraestructura durable verificable.

Supabase Realtime sirve para actualización de clientes, no sustituye un log durable de integración.

---

## 3. Problema

El sistema debe garantizar que:

- un hecho confirmado produzca su mensaje;
- un rollback no publique;
- un crash no pierda trabajo;
- un retry no duplique efectos;
- un consumidor pueda recuperarse;
- y los eventos conserven tenant, correlación y versión.

No se requiere exactamente una vez; se requiere efecto idempotente.

---

## 4. Alcance

Esta decisión cubre:

- eventos de dominio;
- eventos de aplicación;
- eventos de integración;
- envelope;
- catálogo;
- versionado;
- outbox;
- publisher;
- inbox;
- consumers;
- retries;
- ordering;
- dead letters;
- webhooks;
- offline change feed;
- seguridad;
- observabilidad;
- y pruebas.

No elige todavía broker, runtime definitivo de workers ni proveedor de colas.

---

## 5. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Consistencia | Crítica | Estado y evento deben confirmarse juntos |
| Durabilidad | Crítica | Un crash no pierde eventos |
| Idempotencia | Crítica | Duplicados no duplican efectos |
| Simplicidad inicial | Alta | PostgreSQL ya es autoridad |
| Multi-tenancy | Crítica | Evento y consumo conservan tenant |
| Evolución | Alta | Contratos versionados |
| Operación | Alta | Retry, locks y dead letters visibles |
| Rendimiento | Alta | Publisher acotado y no bloqueante |
| Seguridad | Alta | Payload mínimo y acceso controlado |
| Portabilidad | Media | Broker futuro sin cambiar semántica |

---

## 6. Restricciones

La decisión deberá respetar:

- PostgreSQL/Supabase;
- ADR-0001 tenant;
- ADR-0002 migraciones;
- ADR-0003 autorización;
- ADR-0005 sync;
- Business Core;
- idempotencia;
- y observabilidad.

Un evento no concederá autoridad a su consumidor.

---

## 7. Supuestos

Esta propuesta asume que:

- el volumen inicial cabe en PostgreSQL;
- los eventos pueden publicarse de forma asíncrona;
- los consumidores toleran duplicados;
- un worker o poller puede ejecutarse de forma controlada;
- y el orden global no es requisito.

Los supuestos se medirán en el vertical slice.

---

## 8. Criterios de decisión

| Criterio | Prioridad | Evaluación |
|---|---|---|
| No pérdida | Crítica | Crash entre commit y publish |
| No efecto duplicado | Crítica | Replay |
| Atomicidad | Crítica | Estado + outbox |
| Recuperación | Alta | Locks abandonados y retry |
| Contrato | Alta | Schema y versión |
| Operación | Alta | Métricas y runbook |
| Costo | Alta | Infraestructura adicional |
| Escalabilidad | Media actual | Throughput y lag |

---

## 9. Opciones consideradas

| Opción | Resumen | Resultado propuesto |
|---|---|---|
| A | PostgreSQL transactional outbox + inbox | Elegida |
| B | Publicación directa después del commit | Rechazada |
| C | Broker externo desde el inicio | Diferida |
| D | Supabase Realtime como bus durable | Rechazada |
| E | Triggers como única fuente de eventos | No elegida como base |

---

## 10. Opción A — Outbox e inbox PostgreSQL

### Descripción

El caso de uso persiste estado y mensaje outbox en una transacción.

Un publisher reclama y entrega mensajes.

El consumidor registra recepción en inbox y aplica efecto idempotente.

### Ventajas

- atomicidad;
- durabilidad;
- infraestructura existente;
- SQL revisable;
- recuperación;
- y ruta a broker futuro.

### Desventajas

- polling;
- tablas operativas;
- limpieza;
- worker;
- y latencia eventual.

### Resultado

Se elige.

---

## 11. Opción B — Publish after commit

### Descripción

La aplicación guarda datos y luego llama al consumidor o proveedor.

### Ventajas

- implementación corta.

### Desventajas

- ventana de pérdida;
- retry difícil;
- acoplamiento;
- y timeout dentro del request.

### Resultado

Se rechaza para eventos que deben ser confiables.

---

## 12. Opción C — Broker externo

### Descripción

Kafka, RabbitMQ, NATS, SQS u otro broker recibe eventos.

### Ventajas

- throughput;
- desacoplamiento;
- routing;
- y tooling especializado.

### Desventajas

- nueva operación;
- costo;
- seguridad;
- skills;
- y el dual-write sigue existiendo sin outbox.

### Resultado

Se difiere hasta demostrar volumen, aislamiento o topología que lo justifique.

---

## 13. Opción D — Supabase Realtime

### Descripción

Consumers dependen de cambios o broadcasts Realtime.

### Ventajas

- integración con clientes;
- baja latencia.

### Desventajas

- no es historial durable de integración;
- reconexión no garantiza replay completo;
- contrato acoplado a tablas;
- y no sustituye inbox.

### Resultado

Se usa para UX cuando aplique, no como bus autoritativo.

---

## 14. Opción E — Triggers únicamente

### Descripción

Triggers construyen todos los eventos a partir de cambios de filas.

### Ventajas

- proximidad a datos;
- cobertura de escrituras.

### Desventajas

- semántica de negocio limitada;
- payload difícil;
- lógica oculta;
- y eventos técnicos en lugar de hechos.

### Resultado

Triggers podrán ayudar en casos específicos, pero el caso de uso es la fuente preferida de intención.

---

## 15. Decisión propuesta

Se propone:

> **CRUMAFOOD persiste eventos de integración en PostgreSQL transactional outbox dentro de la transacción del caso de uso, los publica al menos una vez y exige inbox e idempotencia en consumidores.**

La decisión incluye:

- taxonomía de eventos;
- envelope canónico;
- schemas versionados;
- outbox;
- publisher;
- claims;
- retry;
- inbox;
- dead letters;
- ordering por stream;
- catálogo;
- y observabilidad.

---

## 16. Tipos de evento

Se distinguirán:

- **Domain Event:** hecho dentro del modelo;
- **Application Event:** resultado útil dentro de la aplicación;
- **Integration Event:** contrato publicado fuera del módulo o proceso.

No todo Domain Event se convierte en Integration Event.

La traducción minimiza acoplamiento.

---

## 17. Efectos síncronos

Permanecerán síncronos:

- invariantes;
- autorización;
- escritura atómica;
- cálculo requerido;
- reserva necesaria;
- y outbox.

No se enviarán dentro de la transacción:

- correos;
- webhooks;
- notificaciones;
- llamadas externas;
- ni procesamiento largo.

---

## 18. Nombres de eventos

Un evento representa un hecho en pasado.

Ejemplos:

- `InventoryMovementRecorded`;
- `PurchaseOrderApproved`;
- `ProductionOrderCompleted`;
- `LotReleased`;
- `SalesOrderConfirmed`.

Se evitarán nombres imperativos como `ProcessOrder`.

---

## 19. Envelope canónico

```text
IntegrationEvent
  eventId
  eventType
  eventVersion
  aggregateType
  aggregateId
  aggregateVersion
  tenantId
  occurredAt
  correlationId
  causationId
  producer
  traceContext
  payload
```

Los campos opcionales se definirán por contrato.

---

## 20. Event ID

`eventId` será:

- globalmente único;
- opaco;
- inmutable;
- y estable entre retries.

El publisher no creará un ID nuevo al reintentar.

Inbox deduplicará por consumer y event ID.

---

## 21. Tenant

Todo evento scoped incluirá `tenantId`.

El publisher y consumidor:

- validarán tenant;
- evitarán routing cruzado;
- separarán idempotencia;
- y auditarán contexto.

Un evento global será excepcional y explícito.

---

## 22. Correlación y causación

`correlationId` agrupa una operación.

`causationId` identifica el comando o evento que causó el nuevo hecho.

Se propagarán a:

- logs;
- traces;
- outbox;
- inbox;
- webhooks;
- y sync.

---

## 23. Payload

El payload será:

- mínimo;
- estable;
- tipado;
- autorizado;
- y libre de secretos.

Se preferirán IDs y hechos necesarios.

No se publicará una copia completa de la fila por conveniencia.

El consumidor consultará datos adicionales mediante contrato cuando corresponda.

---

## 24. Versionado

`eventVersion` versiona el schema del tipo.

Cambios aditivos compatibles podrán conservar versión según reglas documentadas.

Cambios incompatibles crearán nueva versión.

Los consumidores declararán versiones soportadas.

No se reescribirá un evento histórico.

---

## 25. Catálogo

Cada evento tendrá:

- nombre;
- versión;
- propietario;
- descripción;
- productor;
- consumers conocidos;
- schema;
- datos;
- clasificación;
- ordering;
- retención;
- y deprecación.

El catálogo vivirá junto a contratos de integración.

---

## 26. Tabla outbox

La outbox incluirá:

- event ID;
- tenant;
- tipo;
- versión;
- agregado;
- payload;
- occurredAt;
- correlation;
- causation;
- estado;
- intento;
- availableAt;
- lock;
- publishedAt;
- y error normalizado.

El diseño exacto se versionará mediante ADR-0002.

---

## 27. Escritura transaccional

El caso de uso:

1. valida;
2. autoriza;
3. modifica agregado;
4. persiste estado;
5. persiste outbox;
6. y confirma transacción.

Si falla cualquier paso, no existe ni estado confirmado ni evento publicable.

---

## 28. Publisher

El publisher:

- reclama batches;
- bloquea de forma segura;
- publica;
- registra intento;
- marca resultado;
- libera;
- y recupera locks abandonados.

Varios publishers podrán coexistir sin publicar indefinidamente el mismo registro.

Duplicados siguen siendo posibles.

---

## 29. Claiming

El claiming usará una estrategia PostgreSQL segura, como filas bloqueadas con skip locked o equivalente probado.

Definirá:

- batch;
- lease;
- owner;
- timeout;
- y recuperación.

El mecanismo exacto se validará con concurrencia.

---

## 30. Entrega

La garantía será:

> **Al menos una vez.**

Esto implica:

- pueden existir duplicados;
- un publish puede completarse antes de registrar éxito;
- y el consumidor debe ser idempotente.

No se prometerá exactamente una vez de extremo a extremo.

---

## 31. Inbox

La inbox conservará:

- consumer;
- event ID;
- tenant;
- versión;
- receivedAt;
- estado;
- intentos;
- resultado o referencia;
- processedAt;
- y error.

`consumer + event_id` será único dentro del alcance necesario.

---

## 32. Consumidor idempotente

Un consumidor:

1. valida envelope;
2. verifica versión;
3. resuelve tenant;
4. registra o reclama inbox;
5. ejecuta efecto;
6. persiste resultado;
7. y marca procesado.

El efecto y estado inbox compartirán transacción cuando sea necesario.

---

## 33. Retries

Los retries usarán:

- máximo;
- backoff;
- jitter;
- clasificación;
- availableAt;
- y observabilidad.

No se reintentará:

- schema inválido;
- versión no soportada;
- autorización permanentemente denegada;
- ni dato corrupto sin corrección.

---

## 34. Dead letters

Un mensaje agotado irá a estado dead letter o almacén equivalente.

Se conservarán:

- evento;
- consumer;
- intentos;
- error;
- fecha;
- y acción requerida.

Reprocesar requerirá autorización, razón e idempotencia.

---

## 35. Ordering

No se garantiza orden global.

Cuando importe se definirá por:

- aggregate ID;
- stream;
- partition key;
- y aggregate version.

Un consumidor detectará gaps o versiones antiguas según su contrato.

---

## 36. Concurrencia

Se probarán:

- dos publishers;
- dos consumers;
- lock abandonado;
- mismo evento duplicado;
- eventos del mismo agregado;
- y tenants distintos.

La concurrencia no deberá producir efectos duplicados.

---

## 37. Retención

La retención considerará:

- replay;
- auditoría;
- diagnóstico;
- volumen;
- privacidad;
- y costo.

Outbox publicada podrá archivarse o purgarse.

Inbox conservará deduplicación durante la ventana de retry y replay.

---

## 38. Webhooks

Un evento podrá originar entrega webhook mediante consumer dedicado.

Ese consumer tendrá:

- subscription;
- destino;
- firma;
- timeout;
- retry;
- circuit breaker;
- idempotencia;
- y dead letter.

El webhook no se enviará dentro de la transacción original.

---

## 39. Notificaciones

Correo, push o notificación interna consumirán eventos.

Una falla de notificación no revertirá el hecho de negocio ya confirmado.

La importancia del mensaje determinará retry y escalación.

No se enviará contenido sensible sin clasificación.

---

## 40. Proyecciones

Las proyecciones se actualizarán mediante consumers idempotentes.

Cada proyección declarará:

- fuente;
- versión;
- frescura;
- rebuild;
- y autoridad.

Una proyección no autoriza una transacción.

---

## 41. Offline change feed

ADR-0005 podrá usar eventos o proyecciones derivadas para producir cambios.

El cliente no consumirá la outbox interna directamente.

Un adaptador:

- filtra por tenant y scope;
- transforma contrato;
- aplica cursor;
- y minimiza payload.

---

## 42. Supabase Realtime

Realtime podrá notificar que existen cambios.

No será:

- almacenamiento de eventos;
- garantía de entrega;
- inbox;
- ni mecanismo de replay.

Tras reconexión, el cliente consultará una fuente durable.

---

## 43. Broker futuro

Un broker se evaluará cuando exista:

- throughput insuficiente;
- múltiples runtimes;
- aislamiento requerido;
- routing complejo;
- retención/replay especializado;
- o necesidad multirregión.

La outbox permanecerá útil para resolver dual-write.

La adopción requerirá ADR nuevo.

---

## 44. Runtime

El publisher podrá comenzar como:

- job acotado;
- función programada;
- o worker

según volumen y límites.

Un cron que dispara no garantiza procesamiento durable.

La tecnología final de worker se decidirá con evidencia.

---

## 45. Seguridad

Se protegerán:

- tablas outbox/inbox;
- payloads;
- datos personales;
- credenciales de destino;
- y operaciones de replay.

Los clientes no tendrán lectura directa de outbox.

Service role estará encapsulada y auditada.

---

## 46. Autorización

Un evento describe un hecho; no concede permiso.

El consumidor:

- valida identidad de servicio;
- limita tenant;
- autoriza operaciones adicionales;
- y no confía ciegamente en payload.

Los eventos externos se verifican antes de convertirse en hechos internos.

---

## 47. Observabilidad

Se medirán:

- outbox pending;
- edad del más antiguo;
- publish rate;
- errores;
- retries;
- locks abandonados;
- inbox duplicates;
- processing latency;
- dead letters;
- versión no soportada;
- y lag por consumer.

---

## 48. Alertas

Se alertará por:

- edad de outbox;
- crecimiento sostenido;
- publisher sin progreso;
- dead letters;
- consumer lag;
- retry storm;
- lock abandonado;
- y fallo de webhook crítico.

Cada alerta tendrá runbook.

---

## 49. Consecuencias positivas

- consistencia estado/evento;
- recuperación;
- idempotencia;
- contratos explícitos;
- desacoplamiento;
- webhooks confiables;
- base para offline;
- y ruta a broker futuro.

---

## 50. Consecuencias negativas

- tablas operativas;
- publisher;
- inbox por consumer;
- limpieza;
- entrega eventual;
- duplicados;
- catálogo;
- monitoreo;
- y mayor complejidad de pruebas.

---

## 51. Impacto arquitectónico

| Área | Impacto |
|---|---|
| Business Core | Traducción de hechos a integration events |
| Datos | Outbox/inbox y migraciones |
| Integraciones | Publisher, consumers y contratos |
| Seguridad | Payload, service identities y replay |
| Despliegue | Runtime de publisher |
| Observabilidad | Lag, retry y dead letters |
| Testing | Crash, duplicado, orden y recovery |
| Offline | Change feed derivado |
| Multi-tenancy | Tenant en envelope y routing |

---

## 52. Migración

La secuencia será:

1. aceptar ADR-0002 o disponer de baseline;
2. definir envelope;
3. crear catálogo;
4. migrar outbox;
5. implementar writer transaccional;
6. implementar publisher;
7. crear consumer piloto;
8. crear inbox;
9. probar fallos;
10. activar observabilidad;
11. y expandir por evento.

---

## 53. Vertical slice

El primer evento deberá:

- representar un hecho real;
- originarse en caso de uso;
- escribirse con transacción;
- alimentar un consumer reversible;
- tolerar duplicados;
- y permitir verificar end-to-end.

Se evitará iniciar con pagos o efectos irreversibles.

Un candidato es una notificación o proyección de una orden confirmada.

---

## 54. Testing

Se probarán:

- commit con outbox;
- rollback sin outbox;
- crash después de publish;
- duplicate;
- payload diferente;
- consumer crash;
- lock abandonado;
- retry;
- dead letter;
- ordering;
- tenants A/B;
- versión;
- cleanup;
- y replay.

---

## 55. Validación previa a Aceptado

Este ADR podrá pasar a Aceptado cuando:

- un caso de uso escriba estado y outbox atómicamente;
- un publisher sobreviva crash;
- un duplicate no duplique efecto;
- inbox sea transaccional;
- un lock abandonado se recupere;
- un evento de versión no soportada se aísle;
- Tenant A no llegue a B;
- métricas y alertas funcionen;
- y Datos, Integración, Seguridad y Arquitectura aprueben.

---

## 56. Rendimiento

Se medirán:

- insert outbox;
- batch claim;
- publish throughput;
- lag;
- tamaño payload;
- índices;
- cleanup;
- y presión sobre PostgreSQL.

El publisher limitará concurrencia y conexiones.

Un broker se considerará antes de saturar la autoridad transaccional.

---

## 57. Riesgos y controles

| Riesgo | Condición | Impacto | Control | Propietario | Señal |
|---|---|---|---|---|---|
| Evento perdido | Dual-write | Crítico | Outbox transaccional | Datos | Reconciliación |
| Efecto duplicado | Retry | Alto/Crítico | Inbox e idempotencia | Consumer | Duplicate count |
| Backlog | Publisher detenido | Alto | Alertas y recovery | Operación | Oldest age |
| Cross-tenant | Routing incorrecto | Crítico | Tenant y constraints | Seguridad | A/B test |
| Payload sensible | Evento excesivo | Alto | Schema y revisión | Seguridad | Scan |
| Poison message | Error permanente | Alto | Dead letter | Integración | DLQ count |
| Orden incorrecto | Consumer asume global | Alto | Stream/version | Módulo | Gap |
| DB saturada | Polling agresivo | Alto | Batches/backoff | Datos | DB load |

---

## 58. Plan de implementación

| Entrega | Alcance | Propietario | Evidencia |
|---|---|---|---|
| Contrato | Envelope y catálogo | Integración | Schema tests |
| Persistencia | Outbox/inbox | Datos | Migraciones |
| Writer | Transacción de caso de uso | Módulo | Rollback test |
| Publisher | Claim/retry/recovery | Integración | Crash test |
| Consumer | Efecto idempotente | Módulo | Duplicate test |
| Operación | Métricas/alertas/runbook | Operación | Drill |
| Piloto | Vertical slice | Producto/QA | E2E |

---

## 59. Preguntas abiertas

Antes de Aceptado se resolverá:

- ¿qué evento inicia el piloto?;
- ¿qué runtime ejecuta publisher?;
- ¿qué batch y lease se usan?;
- ¿qué retención necesita outbox?;
- ¿qué ventana necesita inbox?;
- ¿qué estrategia de cleanup se adopta?;
- ¿cómo se publican schemas?;
- ¿qué consumer requiere ordering?;
- y ¿qué umbral dispara evaluación de broker?

---

## 60. Triggers de revisión

Este ADR se revisará cuando:

- PostgreSQL no sostenga throughput;
- se adopte broker;
- existan múltiples regiones;
- se requiera replay largo;
- cambie el modelo offline;
- un incidente cuestione idempotencia;
- o el número de consumers vuelva insuficiente el modelo.

Fecha de revisión sugerida: después del piloto y al primer consumer externo.

---

## 61. Registro de aprobación

| Rol | Decisión | Fecha | Evidencia |
|---|---|---|---|
| Product Owner | Pendiente | — | — |
| Responsable de arquitectura | Pendiente | — | — |
| Responsable de integración | Pendiente | — | — |
| Responsable de datos | Pendiente | — | — |
| Responsable de seguridad | Consultado, pendiente | — | — |
| Responsable de operación | Consultado, pendiente | — | — |

El estado permanecerá Propuesto hasta completar el vertical slice.

---

## 62. Historial

| Fecha | Cambio | Autor o rol |
|---|---|---|
| 2026-07-12 | Propuesta inicial | Responsable de arquitectura |

Después de Aceptado, un cambio de garantía o topología requerirá un ADR nuevo.

---

## 63. Referencias

- [Registro ADR](README.md)
- [Plantilla ADR](0000-template.md)
- [ADR-0002: Schema baseline](0002-schema-baseline-and-migrations.md)
- [ADR-0005: Offline sync](0005-offline-sync-strategy.md)
- [Arquitectura de integración](../integration-architecture.md)
- [Arquitectura de datos](../data-architecture.md)
- [Business Core](../business-core.md)
- [Arquitectura de observabilidad](../observability-architecture.md)
- [Estrategia de pruebas](../testing-strategy.md)

---

## 64. Resultado de la propuesta

Si se acepta, CRUMAFOOD podrá desacoplar efectos posteriores sin perder la relación entre un hecho confirmado y su publicación.

Si se rechaza, deberá elegirse una alternativa que elimine el dual-write, tolere duplicados, conserve tenant y permita recuperación demostrable.

---

## 65. Declaración final

> **Un evento de CRUMAFOOD será un hecho durable y versionado. La outbox garantizará que pueda publicarse; la inbox garantizará que pueda repetirse; y el Business Core conservará la autoridad sobre lo que realmente ocurrió.**
