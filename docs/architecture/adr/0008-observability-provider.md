# ADR-0008: Adoptar Sentry como plataforma inicial de observabilidad de aplicación

> **Propuesta:** centralizar errores, trazas de aplicación y contexto de release en Sentry; conservar Vercel y Supabase como fuentes nativas de plataforma; y mantener semántica compatible con OpenTelemetry para reducir acoplamiento.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-07-12 |
| Decisores | Product Owner, responsable de arquitectura, responsable de operación y responsable de seguridad |
| Consultados | Desarrollo, calidad, soporte, datos, frontend, Mobile y Desktop |
| Informados | Responsables de módulos y usuarios de releases |
| Propietario | Operación/Platform Engineering con corresponsabilidad de Arquitectura |
| Alcance | Errores, performance, trazas, releases, alertas, fuentes nativas, privacidad, retención, costo y salida del proveedor |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; requiere piloto antes de aceptación |
| Issues relacionados | Pendiente: cuenta, proyecto piloto, presupuesto, SDK, sourcemaps, alertas, redacción y runbooks |

---

## 1. Resumen ejecutivo

CRUMAFOOD no tiene una plataforma central verificable para errores, performance o correlación de releases. Hoy depende de consolas separadas, `console.error`, logs nativos y un health check básico.

La decisión propuesta es:

> **Sentry Cloud será la plataforma inicial de observabilidad de aplicación para Web y, cuando existan clientes distribuibles, Mobile y Desktop. Vercel Observability y Supabase Monitoring conservarán la autoridad sobre sus señales nativas. La instrumentación propia utilizará nombres, atributos y propagación compatibles con OpenTelemetry; Session Replay permanecerá desactivado.**

La aceptación dependerá de un piloto con captura verificada, redacción de datos, alertas accionables, costo medido y procedimiento de salida.

---

## 2. Contexto

La plataforma utiliza Next.js, Vercel y Supabase/PostgreSQL, y prevé clientes Mobile y Desktop.

La arquitectura de observabilidad exige:

- errores centralizados;
- correlación por entorno, release y solicitud;
- logs estructurados;
- trazas progresivas;
- alertas accionables;
- privacidad por diseño;
- y portabilidad razonable.

ADR-0007 requiere observar cada despliegue y ejecutar smoke tests. Sin una plataforma común, esa evidencia queda fragmentada.

---

## 3. Estado actual

El repositorio no contiene implementación verificable de:

- SDK de Sentry;
- OpenTelemetry;
- logger estructurado común;
- source maps publicados de forma gobernada;
- catálogo de alertas;
- dashboards operativos;
- SLI o SLO medidos;
- synthetic monitoring;
- ni collector de telemetría.

Las referencias documentales a proveedores expresan dirección, no capacidad instalada.

---

## 4. Problema

CRUMAFOOD necesita detectar, agrupar y diagnosticar fallos de aplicación entre runtimes sin construir desde cero una plataforma operativa ni quedar encerrado en una semántica propietaria.

La decisión debe equilibrar:

- tiempo de adopción;
- cobertura de Next.js y futuros clientes;
- privacidad;
- costo;
- calidad de diagnóstico;
- alertamiento;
- y reversibilidad.

---

## 5. Alcance

Esta decisión cubre:

- proveedor inicial de errores y APM de aplicación;
- relación con señales nativas de Vercel y Supabase;
- trazas y contexto de release;
- sourcemaps;
- alertas iniciales;
- privacidad y redacción;
- retención y acceso;
- muestreo y costo;
- prueba piloto;
- y estrategia de salida.

No define todavía:

- SLO, RPO o RTO;
- proveedor definitivo de synthetic monitoring;
- guardias fuera de horario;
- lago central de logs;
- collector OpenTelemetry autogestionado;
- analítica de producto;
- auditoría de negocio;
- ni Session Replay.

---

## 6. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Tiempo hasta diagnóstico | Crítica | Integración madura con Next.js y errores agrupados |
| Privacidad | Crítica | Redacción antes del envío y mínima identidad |
| Cobertura multiplataforma | Alta | Web ahora; Mobile y Desktop después |
| Correlación | Crítica | Entorno, release, trace y request identificables |
| Portabilidad | Alta | OpenTelemetry y contratos propios |
| Operación | Alta | Alertas, ownership y runbooks |
| Costo | Alta | Muestreo, cuotas y retención gobernados |
| Mantenimiento | Alta | Evitar operar infraestructura prematuramente |
| Señales de plataforma | Alta | No perder detalle nativo de Vercel y Supabase |
| Reversibilidad | Alta | Exportación, desactivación y sustitución probadas |

---

## 7. Restricciones

La decisión deberá respetar:

- secretos fuera del repositorio;
- datos sensibles excluidos por diseño;
- separación de entornos;
- identificadores de usuario seudonimizados;
- ninguna captura de cuerpos, tokens, cookies o encabezados de autorización;
- Session Replay desactivado;
- aceptación explícita antes de producción;
- y presupuesto aprobado.

---

## 8. Supuestos

La propuesta asume que:

- Next.js y Vercel seguirán siendo el runtime Web inicial;
- Supabase seguirá aportando señales propias de datos y plataforma;
- el equipo necesita valor operativo antes de justificar un stack autogestionado;
- el volumen inicial permite un piloto acotado;
- y Mobile/Desktop aún no requieren despliegue inmediato del SDK.

Si cambia un supuesto, este ADR se revisará.

---

## 9. Criterios de decisión

| Criterio | Prioridad | Evidencia requerida |
|---|---|---|
| Integración Next.js | Crítica | Error cliente, servidor y edge en piloto |
| Diagnóstico | Crítica | Stack trace, release, entorno y correlación |
| Privacidad | Crítica | Pruebas negativas de datos prohibidos |
| Alertamiento | Alta | Alerta P1/P2 y runbook ejecutados |
| Portabilidad | Alta | Atributos propios y compatibilidad OTel |
| Operación | Alta | Baja carga de mantenimiento |
| Multiplataforma | Media | SDK o integración viable para clientes futuros |
| Costo | Alta | Consumo y proyección documentados |
| Salida | Alta | Exportación o sustitución demostrable |

---

## 10. Opciones consideradas

| Opción | Resumen | Resultado |
|---|---|---|
| A | Sentry + señales nativas + semántica OTel | Elegida |
| B | Solo Vercel y Supabase | No elegida |
| C | Grafana Cloud con stack OTel | No elegida por ahora |
| D | Datadog | No elegida por ahora |
| E | Stack autogestionado | No elegida |
| F | Mantener estado actual | No elegida |

---

## 11. Opción A — Sentry con fuentes nativas

Sentry centraliza errores de aplicación, performance, releases y alertas. Vercel y Supabase conservan diagnóstico especializado. OpenTelemetry guía la semántica y la propagación.

Ventajas:

- adopción incremental;
- integración específica con Next.js;
- agrupación de errores y contexto de release;
- soporte de trazas;
- menor carga operativa inicial;
- y ruta multiplataforma.

Desventajas:

- un tercer proveedor y costo adicional;
- señales repartidas entre consolas;
- riesgo de lock-in en features propietarias;
- y necesidad de gobernar volumen, PII y sourcemaps.

---

## 12. Opción B — Solo Vercel y Supabase

Utiliza exclusivamente las consolas nativas.

Se descarta porque no ofrece una visión común de errores entre Web, Mobile y Desktop, ni un ownership uniforme de releases y alertas de aplicación.

Las consolas nativas siguen siendo necesarias, pero no suficientes.

---

## 13. Opción C — Grafana Cloud

Ofrece un destino amplio para métricas, logs y trazas basado en estándares.

No se elige inicialmente porque exige diseñar antes el pipeline de telemetría, dashboards y operación. Se reconsiderará cuando métricas, logs centralizados o múltiples servicios justifiquen esa amplitud.

---

## 14. Opción D — Datadog

Proporciona una suite integrada con cobertura amplia.

No se elige inicialmente por costo y complejidad potenciales frente al tamaño y madurez actuales. Podrá reevaluarse con volumen, soporte operativo y presupuesto comprobados.

---

## 15. Opción E — Stack autogestionado

Un stack con Collector, almacenamiento y visualización propios maximiza control, pero crea carga de disponibilidad, upgrades, seguridad, retención, respaldo y costo humano.

Se descarta mientras observar CRUMAFOOD implique operar una plataforma más compleja que la aplicación observada.

---

## 16. Opción F — Mantener estado actual

Continuar con consola y logs dispersos no satisface detección, correlación, alertamiento ni evidencia posterior al despliegue.

Se descarta.

---

## 17. Decisión propuesta

CRUMAFOOD adoptará el siguiente modelo inicial:

1. Sentry Cloud para errores, performance, trazas de aplicación y releases;
2. Vercel Observability para infraestructura y runtime Web;
3. Supabase Logs, Metrics y herramientas nativas para datos y servicios Supabase;
4. convenciones OpenTelemetry para atributos y propagación propia;
5. logger estructurado como contrato interno;
6. alertas accionables con propietario y runbook;
7. Session Replay desactivado;
8. muestreo, retención y cuotas explícitas;
9. y piloto antes de aceptación.

---

## 18. Autoridad de las señales

| Señal | Fuente primaria inicial | Uso |
|---|---|---|
| Excepción de aplicación | Sentry | Detección, agrupación y diagnóstico |
| Performance de aplicación | Sentry | Trazas y transacciones seleccionadas |
| Release y regresión | Sentry + GitHub/Vercel | Correlación con despliegue |
| Runtime y requests Web | Vercel | Infraestructura y plataforma |
| PostgreSQL, Auth, Storage y Realtime | Supabase | Diagnóstico del proveedor |
| Auditoría de negocio | Base gobernada propia | Evidencia funcional |
| Analítica de producto | Fuera de este ADR | Adopción y comportamiento |

Ninguna consola aislada será declarada fuente completa.

---

## 19. Límites de OpenTelemetry

OpenTelemetry será:

- la dirección de interoperabilidad;
- la referencia para trace/span IDs;
- la base de nombres y atributos técnicos;
- y el mecanismo preferido para instrumentación portable.

Este ADR no obliga todavía a:

- desplegar un Collector;
- exportar todas las señales por OTLP;
- sustituir la instrumentación automática del proveedor;
- ni centralizar todo log.

---

## 20. Instrumentación Web

El piloto cubrirá:

- navegador;
- runtime Node.js;
- runtime Edge cuando aplique;
- Route Handlers;
- errores de React;
- navegación;
- requests salientes seleccionados;
- y Server Actions mediante instrumentación explícita cuando sea necesaria.

La configuración será revisada manualmente; no se aceptará un wizard sin inspeccionar sus cambios.

---

## 21. Mobile y Desktop

Mobile y Desktop adoptarán el mismo modelo conceptual cuando existan builds distribuibles:

- nombre de servicio;
- release;
- entorno;
- instalación seudonimizada;
- conectividad;
- sincronización;
- hardware;
- y consentimiento para diagnóstico ampliado.

Este ADR no instala todavía SDKs en clientes inexistentes o no preparados.

---

## 22. Identidad de servicio

Las señales usarán nombres estables:

```text
cruma-web
cruma-mobile
cruma-desktop
cruma-jobs
cruma-workers
```

No se usarán nombres de repositorio, URLs dinámicas o IDs de despliegue como identidad del servicio.

---

## 23. Entornos

Se distinguirán al menos:

- `local`;
- `test`;
- `preview`;
- `staging`, cuando exista;
- y `production`.

Preview no contaminará alertas ni métricas de Production.

---

## 24. Releases

Cada evento incluirá una release inmutable derivada del commit o artefacto.

ADR-0007 publicará la relación entre:

- commit;
- build;
- deployment;
- entorno;
- y release de Sentry.

Un rollback o roll-forward deberá conservar esa trazabilidad.

---

## 25. Source maps

Los source maps se cargarán desde CI con credenciales de alcance mínimo.

No se expondrán públicamente cuando la configuración permita evitarlo.

La validación confirmará que un error minificado se resuelve a archivo y línea útiles sin publicar código fuente sensible por accidente.

---

## 26. Correlación

Cuando aplique, las señales incluirán:

- `trace_id`;
- `span_id`;
- `request_id`;
- `correlation_id`;
- `service.name`;
- `deployment.environment`;
- `service.version`;
- operación normalizada;
- y resultado.

Los identificadores se propagarán solo por límites confiables y encabezados permitidos.

---

## 27. Identidad de usuario

Sentry no recibirá por defecto:

- nombre;
- correo;
- teléfono;
- dirección;
- IP completa;
- ni identificadores de negocio legibles.

Cuando sea necesario correlacionar, se usará un identificador seudonimizado, estable solo en el ámbito autorizado y documentado.

---

## 28. Datos prohibidos

Nunca se enviarán:

- contraseñas;
- tokens;
- cookies;
- encabezados `Authorization`;
- service-role keys;
- cuerpos completos de requests o responses;
- datos de pago;
- documentos;
- contenido de archivos;
- SQL con parámetros sensibles;
- ni payloads completos de webhooks.

---

## 29. Redacción

La redacción ocurrirá antes de la transmisión mediante:

- allowlists de atributos;
- hooks de procesamiento;
- normalización de errores;
- truncado de valores;
- eliminación de query strings sensibles;
- y pruebas automatizadas.

La interfaz del proveedor no será la primera barrera de privacidad.

---

## 30. Session Replay

Session Replay permanecerá desactivado en todos los entornos con datos reales.

Su adopción requerirá otro ADR que defina:

- finalidad;
- consentimiento;
- enmascaramiento;
- retención;
- acceso;
- exclusiones;
- y evaluación legal y de seguridad.

---

## 31. Logging estructurado

La aplicación dependerá de un contrato propio de logger, no de llamadas directas al SDK.

Cada evento tendrá:

- nombre estable;
- nivel;
- timestamp;
- servicio;
- entorno;
- release;
- correlación;
- resultado;
- y atributos permitidos.

El transporte a Sentry podrá cambiar sin reescribir el dominio.

---

## 32. Errores

Los errores se clasificarán en:

- esperados y controlados;
- validación;
- autorización;
- dependencia;
- transitorios;
- permanentes;
- y defectos no controlados.

No todo 4xx generará issue. Todo fallo crítico deberá conservar contexto seguro suficiente para actuar.

---

## 33. Tracing

El tracing será gradual y orientado a límites:

- request HTTP;
- caso de uso crítico;
- consulta significativa;
- llamada externa;
- job;
- webhook;
- evento;
- y sincronización.

No se creará un span por cada función interna.

---

## 34. Muestreo

La política inicial deberá:

- conservar errores críticos;
- conservar transacciones lentas relevantes;
- reducir health checks;
- limitar tráfico normal;
- separar Preview de Production;
- y poder cambiarse sin redeploy cuando sea seguro.

La tasa concreta se fijará con el piloto, no por intuición.

---

## 35. Alertas iniciales

El piloto deberá configurar como máximo un conjunto pequeño:

1. nueva regresión crítica en Production;
2. aumento sostenido de errores no controlados;
3. fallo de flujo crítico seleccionado;
4. degradación de latencia seleccionada;
5. y ausencia o fallo de job crítico cuando exista señal durable.

Cada alerta tendrá severidad, propietario, canal, umbral, ventana y runbook.

---

## 36. Notificaciones

Una alerta no se enviará a un canal sin propietario.

Se evitarán:

- alertas por cada excepción individual;
- notificaciones de Preview a operación;
- duplicados entre Sentry, Vercel y Supabase;
- y mensajes sin enlace a evidencia y acción.

---

## 37. Dashboards

El dashboard inicial mostrará:

- salud por entorno;
- errores por release;
- flujos críticos seleccionados;
- latencia y throughput disponibles;
- dependencias con fallo;
- y consumo de cuota.

Los detalles especializados permanecerán en Vercel o Supabase cuando esa sea la fuente más fiel.

---

## 38. Retención

La retención se definirá por señal, entorno, necesidad operativa, privacidad y costo.

No se contratará retención extensa sin caso de uso.

Antes de aceptación se documentarán límites reales del plan elegido y el proceso de eliminación solicitado.

---

## 39. Acceso

Se aplicarán:

- SSO cuando el plan y la organización lo permitan;
- MFA obligatorio;
- mínimo privilegio;
- separación entre administración y lectura;
- revisión periódica de miembros;
- y auditoría de cambios disponible según plan.

Los tokens de CI tendrán alcance mínimo y rotación.

---

## 40. Secretos

DSN, auth tokens y credenciales se administrarán mediante GitHub Environments, Vercel o el gestor autorizado.

El DSN público no autoriza acceso de lectura, pero su uso se protegerá contra abuso mediante configuración, cuotas y filtros.

Ningún token administrativo se expondrá al cliente.

---

## 41. Costos

Se medirá:

- eventos ingeridos;
- errores;
- spans;
- logs;
- attachments;
- retención;
- usuarios del proveedor;
- y proyección mensual.

El presupuesto tendrá alertas y un propietario. Superar cuota no deberá causar fallo funcional en CRUMAFOOD.

---

## 42. Disponibilidad y degradación

La observabilidad es una dependencia no crítica para el flujo transaccional.

Si Sentry falla:

- el negocio continúa;
- la emisión no bloquea requests;
- los timeouts son acotados;
- no se reintenta sin límite;
- y se conserva diagnóstico local seguro cuando sea razonable.

---

## 43. Vercel

Vercel seguirá aportando señales de infraestructura, requests, funciones y despliegues.

La exportación mediante Drains u OTLP se evaluará según plan, costo y necesidad. No se declarará disponible hasta configurarla y verificarla.

---

## 44. Supabase

Supabase seguirá siendo la fuente especializada para PostgreSQL, Auth, Storage, Realtime y componentes administrados.

Logs Explorer, Metrics API y Log Drains se utilizarán solo según capacidades y plan contratados. No se duplicará telemetría de alto volumen sin objetivo.

---

## 45. CI/CD

ADR-0007 incorporará gates para:

- configuración válida;
- sourcemaps;
- release metadata;
- pruebas de redacción;
- smoke de captura en entorno no productivo;
- y verificación posterior al despliegue.

Un fallo de telemetría crítica bloqueará promoción cuando impida comprobar la salud de la release.

---

## 46. Piloto

El piloto se ejecutará en un proyecto y entorno no productivo.

Debe demostrar:

1. error browser capturado;
2. error server capturado;
3. stack trace simbolizado;
4. release y entorno correctos;
5. request o trace correlacionado;
6. datos prohibidos ausentes;
7. alerta recibida;
8. runbook ejecutado;
9. consumo medido;
10. y desactivación segura.

---

## 47. Validación de privacidad

Se usarán payloads canarios con valores que nunca deben salir.

La prueba fallará si la búsqueda del proveedor encuentra:

- token canario;
- correo canario;
- teléfono canario;
- cookie canaria;
- cuerpo de webhook canario;
- o query string sensible canaria.

La evidencia se conservará sin copiar el dato prohibido real.

---

## 48. Validación operativa

Una persona distinta de quien instrumentó deberá:

- recibir una alerta;
- identificar entorno y release;
- localizar el flujo afectado;
- distinguir aplicación de plataforma;
- seguir el runbook;
- y cerrar o escalar el incidente.

Si solo el autor puede diagnosticar, la solución no está lista.

---

## 49. Estrategia de salida

La salida del proveedor requerirá:

- desactivar exportadores por configuración;
- conservar nombres y atributos internos;
- sustituir el adapter del logger;
- exportar evidencia permitida cuando el plan lo admita;
- eliminar tokens y SDKs;
- comprobar que el negocio continúa;
- y documentar eliminación o expiración de datos.

No se diseñará una abstracción que oculte todas las capacidades, solo los contratos que CRUMAFOOD controla.

---

## 50. Consecuencias positivas

- diagnóstico central de errores de aplicación;
- relación entre regresiones y releases;
- adopción rápida sin operar un backend propio;
- cobertura futura de clientes;
- alertas y ownership explícitos;
- uso complementario de señales nativas;
- y una ruta compatible con OpenTelemetry.

---

## 51. Consecuencias negativas

- costo y dependencia de un proveedor adicional;
- aprendizaje y gobierno nuevos;
- información distribuida entre tres consolas;
- trabajo continuo de redacción y muestreo;
- riesgo de ruido o cardinalidad;
- y funciones propietarias que podrían dificultar una migración.

---

## 52. Riesgos y controles

| Riesgo | Control |
|---|---|
| Exposición de PII | Allowlists, redacción previa y pruebas canarias |
| Volumen impredecible | Muestreo, cuotas y alertas de costo |
| Alert fatigue | Pocas alertas, ownership y revisión |
| Lock-in | Semántica OTel, adapter y prueba de salida |
| Duplicación de señales | Matriz de autoridad y catálogo |
| Sourcemaps expuestos | Upload desde CI y verificación |
| Telemetría bloquea negocio | Envío asíncrono, timeouts y fail-open |
| Preview contamina Production | Proyectos o entornos separados y filtros |
| SDK excesivo en clientes | Budget de performance y carga diferida cuando aplique |

---

## 53. Plan de implementación

### Fase 0 — Gobierno

- aprobar presupuesto piloto;
- crear proyecto no productivo;
- definir roles;
- y registrar clasificación de datos.

### Fase 1 — Web mínima

- integrar SDK revisado;
- configurar browser, server y edge;
- publicar sourcemaps;
- añadir release y entorno;
- y capturar errores controlados de prueba.

### Fase 2 — Seguridad y operación

- implementar redacción;
- añadir pruebas canarias;
- configurar alertas;
- redactar runbooks;
- y medir cuota.

### Fase 3 — Correlación

- propagar IDs;
- instrumentar flujos críticos;
- y relacionar señales con Vercel y Supabase.

### Fase 4 — Expansión

- evaluar Mobile y Desktop;
- evaluar logs o Drains;
- y revisar necesidad de Collector.

---

## 54. Criterios para Aceptado

El ADR podrá pasar a Aceptado cuando exista:

- piloto reproducible;
- aprobación de seguridad y privacidad;
- costo mensual proyectado y autorizado;
- error Web capturado en todos los runtimes aplicables;
- sourcemaps correctos;
- release y entorno verificables;
- prueba canaria limpia;
- alerta y runbook ejecutados;
- límites de retención documentados;
- prueba de degradación;
- y propietario operativo.

---

## 55. Preguntas abiertas

Antes de Aceptado se resolverá:

- ¿qué plan y cuota se contratarán?;
- ¿se separarán proyectos por entorno?;
- ¿qué tasas de muestreo soporta el presupuesto?;
- ¿qué región y retención aplican?;
- ¿qué canales recibirán alertas?;
- ¿qué identificador seudonimizado se permite?;
- ¿qué señales permanecerán solo en Vercel o Supabase?;
- ¿cuándo se justifica un Collector?;
- y ¿qué requisito contractual existe para exportación y borrado?

---

## 56. Métricas de la decisión

Se evaluará:

- tiempo medio hasta detección;
- tiempo medio hasta diagnóstico;
- porcentaje de errores con release y entorno;
- porcentaje de alertas accionables;
- falsos positivos;
- eventos descartados por redacción;
- consumo contra cuota;
- costo por entorno;
- y regresiones identificadas antes de afectar operación prolongada.

---

## 57. Triggers de revisión

Este ADR se revisará cuando:

- el costo exceda presupuesto dos periodos;
- Sentry no cubra un runtime crítico;
- exista incidente de privacidad;
- la retención resulte insuficiente;
- se adopten múltiples servicios o workers;
- métricas y logs requieran backend unificado;
- el soporte necesite operación 24/7;
- cambien materialmente Vercel, Supabase o Sentry;
- o la salida no pueda demostrarse.

---

## 58. Registro de aprobación

| Rol | Estado | Evidencia |
|---|---|---|
| Product Owner | Pendiente | Presupuesto y prioridad |
| Arquitectura | Pendiente | Revisión de decisión y portabilidad |
| Operación | Pendiente | Piloto, alertas y runbooks |
| Seguridad/Privacidad | Pendiente | Redacción, acceso y retención |
| Desarrollo | Pendiente | Integración y pruebas |

El texto no equivale a aprobación.

---

## 59. Historial

| Fecha | Cambio |
|---|---|
| 2026-07-12 | Creación de la propuesta ADR-0008 |

---

## 60. Referencias

- [Arquitectura de observabilidad](../observability-architecture.md)
- [Arquitectura de despliegue](../deployment-architecture.md)
- [Estrategia de pruebas](../testing-strategy.md)
- [ADR-0007 — Pipeline CI/CD](0007-ci-cd-pipeline.md)
- [Sentry para Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry y OpenTelemetry](https://docs.sentry.io/platforms/javascript/guides/nextjs/opentelemetry/)
- [Instrumentación de Vercel](https://vercel.com/docs/tracing/instrumentation)
- [Vercel Drains](https://vercel.com/docs/drains)
- [Logging de Supabase](https://supabase.com/docs/guides/telemetry/logs)
- [Metrics API de Supabase](https://supabase.com/docs/guides/telemetry/metrics)
- [Log Drains de Supabase](https://supabase.com/docs/guides/telemetry/log-drains)

Las capacidades comerciales y límites de plan se verificaron el 2026-07-12 y deberán confirmarse antes de compra o aceptación.

---

## 61. Resultado de la propuesta

Esta propuesta entrega una primera capa operativa útil sin declarar resuelta toda la observabilidad.

Sentry concentra diagnóstico de aplicación; Vercel y Supabase conservan señales nativas; OpenTelemetry protege la evolución; y las decisiones de SLO, synthetic monitoring, logs centralizados y operación permanente permanecen separadas.

---

## 62. Declaración final

> **CRUMAFOOD observará primero los fallos que afectan su operación, con Sentry como plataforma inicial de aplicación, fuentes nativas para la plataforma y contratos portables que permitan evolucionar sin perder control sobre privacidad, costo ni salida.**
