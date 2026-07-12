# ADR-0010: Adoptar caché explícita, scoped y orientada a frescura

> **Propuesta:** tratar toda caché como una proyección descartable; desactivar caché compartida por defecto para datos autenticados o transaccionales; y permitirla solo mediante políticas explícitas de clave, frescura, invalidación, aislamiento y observabilidad.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-07-12 |
| Decisores | Product Owner, responsable de arquitectura, responsable de seguridad y responsable de operación |
| Consultados | Desarrollo, datos, frontend, Mobile, Desktop, calidad y responsables de módulos |
| Informados | Soporte, responsables de releases y propietarios de flujos |
| Propietario | Arquitectura y Performance Engineering, con corresponsabilidad de Seguridad y Datos |
| Alcance | Next.js, React Query, navegador, CDN, assets, datos públicos, datos autenticados, multi-tenancy, invalidación y evolución |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; requiere piloto y pruebas de aislamiento antes de aceptación |
| Issues relacionados | Pendiente: cache catalog, query-key factory, retirar defaults globales riesgosos, tags, headers, pruebas y métricas |

---

## 1. Resumen ejecutivo

CRUMAFOOD usa Next.js 15, React Query y Supabase. El código contiene invalidaciones por ruta, un `staleTime` global de un minuto, `refetchOnWindowFocus: false` y al menos una query key `['users']` sin tenant. No existe un catálogo que declare qué datos pueden cachearse ni cómo se invalidan.

La decisión propuesta es:

> **La caché será opt-in, derivada y nunca autoritativa. Los datos autenticados, permisos, inventario, costos y transacciones serán dinámicos o privados por defecto. Los assets públicos versionados usarán caché inmutable; el contenido público estable podrá revalidarse; y toda caché scoped incluirá entorno, versión, tenant y dimensiones de autorización necesarias.**

Redis no se incorpora. React Query se gobernará por query-key factories y políticas por tipo de dato, no por un `staleTime` global.

---

## 2. Contexto

PostgreSQL/Supabase es la fuente de autoridad del estado transaccional compartido.

La plataforma además necesita:

- navegación rápida;
- menos round trips;
- renderizado eficiente;
- operación multi-tenant;
- datos frescos para inventario y órdenes;
- contenido público eficiente;
- y soporte offline acotado.

Estas necesidades no justifican compartir respuestas autenticadas ni ocultar consultas deficientes.

---

## 3. Estado actual

Se identificó:

- Next.js `15.5.19`;
- TanStack React Query `5.66.9`;
- un `QueryClient` con `staleTime: 60 s` global;
- `retry: 1` global;
- `refetchOnWindowFocus: false` global;
- query key `['users']` sin tenant;
- múltiples `revalidatePath` después de mutaciones;
- y ausencia de Redis o caché compartida externa.

No se identificó una política verificable para tags, headers, TTL por recurso, invalidación por evento, cambio de tenant o medición de hit ratio.

---

## 4. Problema

Una caché incorrecta puede:

- mostrar datos de otro tenant;
- conservar permisos revocados;
- presentar inventario obsoleto;
- duplicar estado entre servidor y cliente;
- ocultar una mutación exitosa;
- servir datos sensibles desde CDN;
- y convertir una optimización en riesgo de integridad.

La plataforma necesita una estrategia única para decidir cuándo cachear, cómo aislar y cuándo invalidar.

---

## 5. Alcance

Esta decisión cubre:

- clasificación de datos;
- cachés de Next.js;
- request memoization;
- Data Cache y Full Route Cache;
- Router Cache;
- React Query;
- HTTP/CDN;
- assets e imágenes;
- claves y tags;
- invalidación;
- multi-tenancy;
- permisos y sesiones;
- Mobile/Desktop/offline;
- observabilidad;
- pruebas;
- y evolución hacia caché compartida.

No define:

- proveedor Redis;
- motor de búsqueda;
- CDN alterna;
- persistencia offline detallada;
- estrategia de sesiones de Supabase;
- ni objetivos finales de latencia.

---

## 6. Principio rector

> **Una caché es una copia derivada, limitada y descartable. Su pérdida no elimina el hecho autoritativo y su presencia no concede autorización.**

Toda lectura cacheada deberá poder explicar:

- de dónde provino;
- para quién es válida;
- cuándo deja de ser fresca;
- qué la invalida;
- y cómo se recupera ante fallo.

---

## 7. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Aislamiento multi-tenant | Crítica | Ninguna key scoped omite tenant |
| Integridad | Crítica | Inventario y transacciones priorizan autoridad |
| Autorización | Crítica | Una caché no sustituye RLS ni reautorización |
| Frescura | Crítica | TTL depende de volatilidad e impacto |
| Rendimiento | Alta | Cachear donde reduzca trabajo medido |
| Reversibilidad | Alta | La caché puede vaciarse sin pérdida autoritativa |
| Operación | Alta | Invalidación y fallos observables |
| Simplicidad | Alta | No añadir Redis sin evidencia |
| Costo | Alta | Evitar recomputación y almacenamiento inútiles |
| Offline | Alta | Distinguir proyección local de caché Web |

---

## 8. Restricciones

La estrategia deberá respetar:

- PostgreSQL como autoridad;
- RLS como defensa de datos;
- tenant explícito;
- autorización en servidor;
- Next.js App Router en Vercel;
- clientes Supabase server/client separados;
- operación online-first;
- comandos offline reautorizados;
- y no exponer secretos o PII en keys públicas.

---

## 9. Supuestos

La propuesta asume que:

- la carga inicial no requiere Redis;
- la mayoría de Admin es autenticada y dinámica;
- Storefront podrá contener datos públicos estables;
- las mutaciones pasan por límites controlados;
- React Query se usa solo para estado remoto interactivo;
- y la instrumentación puede evolucionar sin cambiar el dominio.

Si cambia un supuesto, este ADR deberá revisarse.

---

## 10. Criterios de decisión

| Criterio | Prioridad | Evidencia |
|---|---|---|
| Aislamiento | Crítica | Pruebas cruzadas entre tenants y usuarios |
| Frescura | Crítica | Edad máxima y mutación visible |
| Corrección | Crítica | Comparación con fuente autoritativa |
| Rendimiento | Alta | Latencia y carga antes/después |
| Invalidación | Crítica | Evento o regla reproducible |
| Seguridad | Crítica | Headers, keys y datos sensibles verificados |
| Operabilidad | Alta | Hit/miss, errores y purge medibles |
| Costo | Alta | Consumo y beneficio documentados |
| Simplicidad | Alta | Menor número de capas posible |

---

## 11. Opciones consideradas

| Opción | Resumen | Resultado |
|---|---|---|
| A | Caché explícita por clasificación y scope | Elegida |
| B | Cachear agresivamente por defecto | No elegida |
| C | No cachear nada | No elegida |
| D | Añadir Redis inmediatamente | No elegida |
| E | Depender de defaults de frameworks | No elegida |

---

## 12. Opción A — Caché explícita

Cada lectura declara clasificación, clave, frescura, invalidación y alcance.

Ventajas:

- seguridad por defecto;
- mejor trazabilidad;
- optimización proporcional;
- y evolución gradual.

Desventajas:

- más decisiones por recurso;
- necesidad de catálogo y pruebas;
- y menor hit ratio inicial en datos autenticados.

---

## 13. Opción B — Caché agresiva

Maximiza hit ratio, pero eleva riesgo de datos obsoletos, cache poisoning y cruces de tenant.

Se descarta para una plataforma transaccional y multi-tenant.

---

## 14. Opción C — Sin caché

Elimina varias clases de invalidez, pero desperdicia CDN, assets inmutables, memoización por request y contenido público estable.

Se descarta como regla absoluta.

---

## 15. Opción D — Redis inmediato

Redis añadiría disponibilidad, costo, claves, memoria, observabilidad, invalidación y operación distribuida.

Se descarta hasta demostrar un caso que no pueda resolverse razonablemente con consultas, índices, Next.js o caché cliente.

---

## 16. Opción E — Defaults implícitos

Next.js y React Query tienen varias capas y defaults que cambian por versión y API.

Depender de ellos sin declarar intención dificulta auditoría y puede cambiar comportamiento durante upgrades. Se descarta.

---

## 17. Decisión propuesta

CRUMAFOOD adoptará:

1. caché opt-in;
2. catálogo por recurso;
3. datos autenticados dinámicos o privados por defecto;
4. assets públicos versionados e inmutables;
5. contenido público estable con revalidación;
6. claves multi-tenant completas;
7. tags por dominio/recurso/scope cuando aplique;
8. invalidación posterior a commit;
9. React Query con políticas por tipo;
10. limpieza completa al cambiar identidad o tenant;
11. métricas y pruebas de frescura;
12. y Redis solo mediante futuro ADR.

---

## 18. Clasificación canónica

| Clase | Ejemplos | Política inicial |
|---|---|---|
| C0 | Assets con hash, bundles, fuentes propias | Pública, larga e inmutable |
| C1 | Contenido público estable | Revalidación temporal y/o por tag |
| C2 | Catálogo autenticado scoped | Privada, TTL corto y tag explícito |
| C3 | Inventario, ATP, órdenes, pagos, costos | Dinámica/no-store por defecto |
| C4 | Permisos, membresía, sesión | No compartida; revalidación de seguridad |
| C5 | Proyecciones offline | Persistencia local gobernada por ADR-0005 |
| C6 | Datos derivados reconstruibles | TTL según frescura y rebuild |

---

## 19. Catálogo de caché

Cada entrada potencial registrará:

- nombre;
- clase;
- fuente autoritativa;
- consumidores;
- entorno;
- scope;
- key schema;
- tags;
- TTL o `staleTime`;
- invalidadores;
- consistencia esperada;
- tamaño;
- propietario;
- fallback;
- métrica;
- y prueba.

Sin registro, la política será no cachear de forma persistente.

---

## 20. Claves

Una key scoped incluirá cuando corresponda:

```text
environment / contract-version / tenant / auth-scope / resource / id / filters / locale
```

Se normalizarán:

- orden de filtros;
- paginación;
- fechas;
- locale;
- y valores opcionales.

No se usarán objetos no deterministas ni datos sensibles legibles en keys públicas.

---

## 21. Tenant

Todo dato de organización, sucursal, almacén o usuario incluirá tenant en la key aunque RLS también lo proteja.

El tenant no se inferirá únicamente desde:

- una ruta visual;
- un store global;
- el resultado cacheado;
- ni una selección anterior.

Una key sin tenant para datos scoped es defecto de seguridad.

---

## 22. Scope de autorización

Cuando el resultado dependa de permisos, la key deberá incluir un scope estable o evitar caché compartida.

No se cachearán decisiones positivas de autorización con TTL que sobreviva a:

- revocación;
- cambio de rol;
- logout;
- cambio de tenant;
- o expiración de sesión.

La autorización final se ejecutará en el servidor y en PostgreSQL/RLS.

---

## 23. Entorno y versión

Preview, staging y Production no compartirán namespace.

La versión de contrato o esquema formará parte de la key cuando un cambio pueda reinterpretar el valor.

Un despliegue no dependerá de que una entrada antigua sea compatible por accidente.

---

## 24. Request memoization

La memoización dentro de un único render de React se permite para deduplicar lecturas idénticas.

No se considerará caché persistente ni requerirá invalidación entre requests.

Para funciones de datos que no usan `fetch`, cualquier memoización deberá conservar contexto y no cruzar requests o identidades accidentalmente.

---

## 25. Next.js Data Cache

La Data Cache persistente será opt-in.

Se permitirá para C1, C2 cuidadosamente scoped y C6 cuando exista:

- key completa;
- TTL o tag;
- invalidación;
- y prueba de aislamiento.

C3 y C4 usarán `no-store` o comportamiento dinámico equivalente salvo excepción aprobada.

---

## 26. Full Route Cache

Se permitirá renderizado estático o revalidado para rutas públicas cuyo contenido completo sea seguro para cualquier visitante.

No se almacenará en Full Route Cache una respuesta que dependa de:

- sesión;
- tenant;
- rol;
- permiso;
- precio privado;
- costo;
- inventario operativo;
- o datos personales.

---

## 27. Router Cache

El Router Cache del navegador mejora navegación, pero puede mostrar payloads anteriores durante una sesión.

Después de mutaciones o cambios de contexto se usará la API apropiada para refrescar o invalidar.

Logout y cambio de tenant deberán eliminar cualquier estado visible previo, no solo redirigir.

---

## 28. `use cache`

La directiva `use cache` no se adoptará mientras requiera una capacidad canary o experimental para la versión instalada.

Su evaluación futura exigirá:

- versión estable;
- semántica comprendida;
- compatibilidad con cookies y headers;
- aislamiento probado;
- y plan de invalidación.

No se activará globalmente para “mejorar performance”.

---

## 29. Revalidación temporal

La revalidación por tiempo se usará cuando:

- el dato sea seguro para el scope;
- tolerar obsolescencia esté documentado;
- no exista evento de invalidación confiable;
- y servir stale durante refresh sea aceptable.

El TTL no expresará precisión mayor que la fuente o el negocio.

---

## 30. Revalidación por tag

Los tags serán el mecanismo preferido para grupos de datos relacionados cuando la API estable lo permita.

Convención conceptual:

```text
cruma:{environment}:{tenant}:{resource}:{id-or-collection}
```

Los tags no contendrán secretos y respetarán límites del framework.

Se invalidará el recurso más estrecho que cubra todas las lecturas afectadas.

---

## 31. Revalidación por ruta

`revalidatePath` permanecerá como mecanismo válido para refrescar salidas de una ruta.

No será el único contrato de consistencia cuando una entidad aparece en múltiples rutas.

Las invalidaciones repetidas actuales se migrarán gradualmente hacia:

- política por recurso;
- tags;
- funciones canónicas;
- y rutas adicionales solo cuando sean necesarias.

---

## 32. Momento de invalidación

La invalidación ocurrirá después de confirmar la transacción autoritativa.

Nunca se invalidará como sustituto de commit.

Si la mutación confirma y la invalidación falla:

- el hecho no se revierte;
- se registra el fallo;
- se reintenta de forma acotada cuando sea seguro;
- y TTL o mecanismo de reparación limita la obsolescencia.

---

## 33. Matriz de mutaciones

Cada caso de uso que modifica datos declarará:

| Campo | Pregunta |
|---|---|
| Hecho modificado | ¿Qué autoridad cambió? |
| Lecturas afectadas | ¿Qué colecciones, detalles y agregados quedan stale? |
| Tenants afectados | ¿Un tenant o alcance global autorizado? |
| Tags | ¿Qué tags invalidar? |
| React Query | ¿Qué query keys invalidar o actualizar? |
| Offline | ¿Qué proyección debe reconciliarse? |
| Evidencia | ¿Cómo se prueba la frescura? |

---

## 34. React Query

React Query se usará solo para estado remoto interactivo de Client Components.

No duplicará datos que un Server Component resuelve suficientemente.

Cada query declarará:

- key factory;
- tenant;
- parámetros;
- `staleTime`;
- `gcTime` cuando difiera;
- retry;
- refetch;
- cancelación;
- invalidación;
- y manejo de autorización.

---

## 35. Query-key factories

Se crearán factories por módulo.

Ejemplo conceptual:

```ts
usersKeys.list({ environment, tenantId, filters })
inventoryKeys.detail({ environment, tenantId, warehouseId, itemId })
```

No se aceptarán keys globales como `['users']` para datos scoped.

La factory será importable por queries, mutaciones y pruebas.

---

## 36. Defaults de React Query

Se eliminará la política global que vuelve fresco todo dato durante un minuto y desactiva refetch al recuperar foco.

El default objetivo será conservador:

- datos stale de inmediato salvo política explícita;
- recolección de queries inactivas según default documentado o límite aprobado;
- retries solo para fallos transitorios;
- no retry en 401, 403 o validación;
- y refetch al recuperar foco para datos que requieran frescura.

Los módulos podrán declarar excepciones justificadas.

---

## 37. Políticas React Query por clase

| Clase | `staleTime` inicial | Refetch |
|---|---:|---|
| C2 catálogo autenticado | 30–60 s, explícito | Focus y mutación según impacto |
| C3 inventario/transacción | 0 s | Mutación, focus y acción crítica |
| C4 permisos/sesión | 0 s o mecanismo Auth | Cambio de contexto y evento de seguridad |
| C6 referencia estable | 5–15 min si se justifica | Tag/evento o focus |

Estos rangos son punto de partida, no defaults universales.

---

## 38. Mutaciones optimistas

Las actualizaciones optimistas solo se permitirán cuando:

- el efecto sea reversible;
- no comprometa inventario, dinero o autorización;
- exista rollback de UI;
- el servidor siga siendo autoridad;
- y la reconciliación esté probada.

Confirmar orden, pago o movimiento de inventario no se declarará exitoso antes de respuesta autoritativa.

---

## 39. Cambio de tenant

Al cambiar tenant se ejecutará en orden seguro:

1. bloquear nuevas operaciones del contexto anterior;
2. cancelar requests en vuelo;
3. resolver comandos offline pendientes;
4. limpiar React Query;
5. limpiar stores y Router Cache aplicables;
6. cargar membresía y permisos nuevos;
7. y habilitar la interfaz.

No se reutilizarán datos por coincidencia de IDs entre tenants.

---

## 40. Logout y cambio de usuario

Logout o sustitución de identidad deberá:

- cancelar requests;
- limpiar caches cliente privadas;
- eliminar persistencia permitida;
- reiniciar stores;
- refrescar rutas;
- y verificar que Back/Forward no revele contenido anterior.

Cerrar sesión no depende solo de borrar un token.

---

## 41. Sesión y autenticación

Las rutas que leen o escriben cookies serán dinámicas y no se cachearán públicamente.

Los datos específicos de usuario no se almacenarán en CDN.

Las verificaciones de identidad y autorización seguirán la semántica de Supabase y no se reemplazarán por un resultado cacheado de UI.

---

## 42. Permisos

Los permisos efectivos pueden cambiar sin que cambie la URL.

Por ello:

- no se cachearán públicamente;
- se invalidarán al cambiar rol o membresía;
- se revalidarán antes de comandos críticos;
- y RLS continuará evaluando el acceso a datos.

Una caché positiva nunca amplía privilegios.

---

## 43. Inventario y ATP

Inventario disponible, reservas y ATP serán C3.

La lectura previa a una decisión crítica será autoritativa o tendrá frescura explícitamente aceptada.

Después de movimientos, recepción, producción, picking o confirmación de orden se invalidarán:

- detalle afectado;
- colección;
- agregados;
- ATP;
- y proyecciones relacionadas.

---

## 44. Órdenes, pagos y costos

Órdenes en transición, pagos, cuentas por cobrar, márgenes y costos no usarán caché compartida.

Las vistas de consulta podrán usar caché privada corta solo si:

- la key incluye scope completo;
- una mutación invalida;
- el usuario ve estado/frescura cuando importe;
- y el backend reautoriza cada comando.

---

## 45. Catálogo

Se distinguirá:

- catálogo público publicable;
- catálogo autenticado por tenant;
- precios públicos;
- listas privadas;
- disponibilidad;
- y costo interno.

No se cacheará un objeto compuesto con la política del campo menos sensible. Se separarán respuestas cuando sus necesidades difieran.

---

## 46. Contenido público

Storefront, documentación pública y contenido estable podrán usar C1.

Cada ruta declarará:

- TTL;
- evento de publicación;
- tag;
- fallback;
- y comportamiento si revalidation falla.

Contenido borrado o despublicado deberá invalidarse de forma prioritaria.

---

## 47. Assets

Assets con hash de contenido usarán headers públicos, largos e inmutables.

Assets sin versión no recibirán caché inmutable.

Un cambio deberá generar nueva URL o hash; no dependerá de purgar navegadores globalmente.

---

## 48. Imágenes y Storage

Se distinguirán objetos públicos y privados.

Las URLs firmadas:

- no se cachearán más allá de su expiración;
- no se reutilizarán entre usuarios sin autorización;
- no se registrarán completas;
- y se renovarán mediante un flujo controlado.

La transformación de imágenes no cambiará la autoridad ni privacidad del objeto.

---

## 49. HTTP y CDN

Política inicial:

| Respuesta | Política |
|---|---|
| Asset versionado público | `public`, larga, `immutable` |
| Contenido público estable | `public` con revalidación controlada |
| Respuesta autenticada | `private` o `no-store` según sensibilidad |
| Permisos, sesión, costos, pagos | `no-store` |
| Error sensible | `no-store` |

Los headers reales se probarán desde CDN, no solo en desarrollo local.

---

## 50. Errores

No se cachearán respuestas 401, 403 o 5xx salvo diseño explícito y seguro para mitigación técnica.

Un error transitorio no reemplazará una entrada buena de forma irreversible.

Servir stale-on-error solo se permitirá para C1 o C6 cuando el usuario no tome una decisión crítica con el dato.

---

## 51. Negative caching

Cachear “no existe” puede ahorrar trabajo, pero también ocultar una creación reciente o una diferencia de autorización.

Solo se permitirá con:

- TTL corto;
- scope completo;
- invalidación en create;
- y distinción entre 404, 403 y dato vacío.

No se convertirá una denegación en ausencia cacheada compartida.

---

## 52. Mobile y Desktop

Los clientes podrán mantener caché local efímera de UI con límites.

Deberán:

- mostrar contexto activo;
- expirar datos;
- limpiar al cambiar identidad;
- cifrar cuando corresponda;
- limitar tamaño;
- y distinguir caché de proyección offline durable.

---

## 53. Offline

ADR-0005 gobierna offline.

Una proyección local offline:

- tiene versión y checkpoint;
- se limita por capacidad;
- puede sobrevivir reinicio;
- y se reconcilia con servidor.

No será tratada como simple caché Web ni como réplica autoritativa.

---

## 54. Realtime

Realtime podrá acelerar invalidación o actualización, pero no será la única garantía.

Un evento perdido deberá repararse mediante:

- refetch;
- TTL;
- reconciliación;
- o versión.

Los canales y eventos incluirán tenant y scope seguro.

---

## 55. Redis

Redis no forma parte de esta decisión.

Requerirá ADR cuando exista evidencia de:

- caché compartida entre instancias;
- rate limiting distribuido;
- coordinación;
- sesiones específicas;
- locks con semántica comprendida;
- o reducción material de carga no alcanzable con PostgreSQL/Next.js.

La evaluación incluirá alta disponibilidad, invalidación, memoria, costo y recuperación.

---

## 56. Orden de optimización

Antes de añadir una caché distribuida se intentará:

1. medir;
2. seleccionar menos columnas;
3. eliminar N+1;
4. paginar;
5. añadir índices justificados;
6. reducir round trips;
7. aprovechar memoización por request;
8. cachear contenido seguro;
9. y solo entonces evaluar infraestructura adicional.

---

## 57. Observabilidad

Cada caché material medirá:

- hit;
- miss;
- bypass;
- stale servido;
- invalidación;
- error de invalidación;
- latencia hit/miss;
- tamaño;
- evictions;
- y edad del valor.

Las métricas no incluirán tenant IDs o keys de alta cardinalidad sin control.

---

## 58. SLO y frescura

ADR-0009 gobierna los objetivos.

Una caché solo se aceptará si:

- mejora latencia o capacidad medida;
- mantiene el SLO de éxito;
- cumple la frescura declarada;
- y no empeora integridad o aislamiento.

Hit ratio alto no compensa datos incorrectos.

---

## 59. Pruebas funcionales

Se probará:

- miss y primer load;
- hit posterior;
- TTL;
- invalidación tras mutación;
- invalidación fallida;
- stale-on-error permitido;
- creación después de negative cache;
- logout;
- cambio de usuario;
- y navegación Back/Forward.

---

## 60. Pruebas multi-tenant

Las pruebas deberán demostrar:

- tenant A no recibe datos de B;
- IDs iguales no colisionan;
- cambiar tenant cancela requests;
- cache cliente se limpia;
- cache servidor usa scope;
- tags no invalidan datos ajenos innecesariamente;
- y CDN nunca sirve respuesta autenticada cruzada.

Se incluirán ejecuciones concurrentes, no solo secuenciales.

---

## 61. Pruebas de seguridad

Se verificará:

- cache poisoning;
- key confusion;
- headers incorrectos;
- query parameters omitidos;
- locale y filtros;
- cookies y `Set-Cookie`;
- URLs firmadas;
- PII en keys;
- revocación de permisos;
- y respuestas de error.

---

## 62. Pruebas de rendimiento

Toda introducción de caché comparará:

- baseline;
- p50, p95 y p99;
- carga a PostgreSQL;
- hit ratio;
- memoria;
- costo;
- tasa de invalidación;
- y frescura.

Una mejora local no se promoverá si aumenta riesgo o costo global sin beneficio material.

---

## 63. CI/CD

ADR-0007 incorporará cuando exista implementación:

- tests de query-key factories;
- tests de políticas de headers;
- tests de invalidación;
- escenarios multi-tenant;
- análisis de rutas públicas/privadas;
- y smoke de mutación seguida de lectura fresca.

---

## 64. Fallo y recuperación

Vaciar la caché deberá ser una operación segura.

Ante corrupción o sospecha:

1. deshabilitar o bypass;
2. purgar el scope afectado;
3. confirmar autoridad;
4. recalentar solo si es necesario;
5. validar frescura e aislamiento;
6. y documentar causa.

La aplicación deberá funcionar, quizá más lenta, sin una caché no esencial.

---

## 65. Consecuencias positivas

- aislamiento explícito;
- menor riesgo de datos obsoletos críticos;
- política uniforme entre servidor y cliente;
- mejor uso de CDN para contenido seguro;
- invalidación trazable;
- evolución gradual;
- y ausencia de infraestructura prematura.

---

## 66. Consecuencias negativas

- más lecturas autoritativas iniciales;
- menor hit ratio en Admin;
- trabajo para crear catálogo y factories;
- migración de invalidaciones existentes;
- necesidad de pruebas complejas;
- y configuración por recurso en lugar de un único default global.

---

## 67. Riesgos y controles

| Riesgo | Control |
|---|---|
| Cruce de tenant | Keys completas y pruebas concurrentes |
| Permiso revocado permanece | No-store, invalidación y reautorización |
| Inventario obsoleto | C3 dinámica y refetch tras mutación |
| Invalidación incompleta | Matriz de mutaciones y tags canónicos |
| Cache stampede | TTL con jitter o coordinación cuando se justifique |
| CDN privada | Headers y pruebas desde edge |
| Key explosion | Normalización, límites y métricas |
| Global staleTime incorrecto | Políticas por clase |
| Framework cambia semántica | Versiones fijadas y prueba de upgrade |
| Redis prematuro | ADR y evidencia previa |

---

## 68. Plan de implementación

### Fase 0 — Inventario

- identificar rutas y queries;
- clasificar C0–C6;
- registrar mutaciones e invalidaciones;
- y detectar respuestas autenticadas cacheables accidentalmente.

### Fase 1 — Seguridad

- crear query-key factories;
- incluir tenant;
- limpiar al cambiar contexto;
- revisar headers;
- y corregir `['users']`.

### Fase 2 — Defaults

- retirar `staleTime` global;
- restablecer refetch seguro;
- clasificar retries;
- y declarar políticas por query.

### Fase 3 — Invalidación

- crear helpers por recurso;
- incorporar tags estables;
- reducir `revalidatePath` duplicados;
- y probar mutación-lectura.

### Fase 4 — Optimización

- instrumentar hit/miss;
- medir baseline;
- cachear C1/C2/C6 de forma selectiva;
- y reevaluar infraestructura solo con evidencia.

---

## 69. Criterios para Aceptado

Este ADR podrá pasar a Aceptado cuando:

- exista catálogo inicial;
- todas las query keys scoped incluyan tenant;
- se elimine la key global de usuarios;
- cambio de tenant y logout limpien estado;
- los defaults React Query sean conservadores;
- rutas autenticadas tengan headers correctos;
- mutaciones T1 invaliden lecturas afectadas;
- exista prueba concurrente multi-tenant;
- se mida frescura y beneficio;
- y Seguridad, Datos y Arquitectura aprueben la política.

---

## 70. Preguntas abiertas

Antes de Aceptado se resolverá:

- ¿qué rutas son realmente públicas?;
- ¿qué catálogo requiere caché privada corta?;
- ¿qué staleTime corresponde a cada módulo?;
- ¿qué tags soporta la versión instalada de Next.js?;
- ¿qué invalidaciones actuales pueden consolidarse?;
- ¿cómo se representa el auth scope en keys?;
- ¿qué persistencia cliente necesita Mobile/Desktop?;
- ¿qué volumen justificaría Redis?;
- y ¿qué datos stale pueden mostrarse durante degradación?

---

## 71. Métricas de la decisión

Se seguirá:

- porcentaje de caches catalogadas;
- query keys conformes;
- rutas privadas con headers conformes;
- hit ratio por clase;
- latencia hit/miss;
- edad p95 de datos;
- fallos de invalidación;
- lecturas stale críticas;
- incidentes de aislamiento;
- carga a PostgreSQL;
- y costo.

---

## 72. Triggers de revisión

Este ADR se revisará cuando:

- cambie la versión mayor de Next.js o React Query;
- se adopte `use cache` estable;
- se incorpore Redis;
- se introduzca búsqueda externa;
- se habilite multi-región;
- cambie el modelo de tenant;
- aparezca un incidente de caché;
- el hit ratio no justifique costo;
- o los SLO requieran otra arquitectura.

---

## 73. Registro de aprobación

| Rol | Estado | Evidencia |
|---|---|---|
| Product Owner | Pendiente | Frescura aceptable por flujo |
| Arquitectura | Pendiente | Catálogo y límites |
| Seguridad | Pendiente | Aislamiento, headers y permisos |
| Datos | Pendiente | Autoridad e invalidación |
| Frontend | Pendiente | React Query y Router Cache |
| Operación | Pendiente | Métricas, purge y recuperación |

El texto no equivale a aprobación.

---

## 74. Historial

| Fecha | Cambio |
|---|---|
| 2026-07-12 | Creación de la propuesta ADR-0010 |

---

## 75. Referencias

- [Arquitectura de rendimiento](../performance-architecture.md)
- [Arquitectura multi-tenant](../multi-tenancy-architecture.md)
- [Arquitectura de datos](../data-architecture.md)
- [Arquitectura de frontend](../frontend-architecture.md)
- [Arquitectura de despliegue](../deployment-architecture.md)
- [ADR-0005 — Estrategia offline](0005-offline-sync-strategy.md)
- [ADR-0009 — Objetivos de servicio y recuperación](0009-service-level-and-recovery-objectives.md)
- [Next.js 15 — Caching](https://nextjs.org/docs/15/app/guides/caching)
- [Next.js 15 — revalidatePath](https://nextjs.org/docs/15/app/api-reference/functions/revalidatePath)
- [Next.js 15 — revalidateTag](https://nextjs.org/docs/15/app/api-reference/functions/revalidateTag)
- [TanStack Query v5 — Query Keys](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys)
- [TanStack Query v5 — Important Defaults](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)
- [Supabase — Server-side Auth Advanced Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)

Las semánticas de framework se verificaron el 2026-07-12 contra Next.js 15 y TanStack Query v5. Se revisarán antes de cualquier upgrade.

---

## 76. Resultado de la propuesta

La propuesta convierte la caché en una optimización gobernada, no en un comportamiento accidental.

CRUMAFOOD obtendrá beneficio de assets, contenido público y estado remoto interactivo sin permitir que una copia stale sustituya PostgreSQL, RLS, autorización o reconciliación.

---

## 77. Declaración final

> **CRUMAFOOD cacheará solo aquello cuya autoridad, scope, frescura e invalidación pueda explicar y probar; ante duda, preferirá una lectura correcta a una respuesta rápida que mezcle tenants o decisiones obsoletas.**
