# ADR-0009: Adoptar objetivos iniciales de servicio y recuperación por criticidad

> **Propuesta:** gobernar confiabilidad mediante SLI y SLO por flujo, error budgets y objetivos RPO/RTO diferenciados por clase de datos, con cifras iniciales revisables y aceptación condicionada a medición y simulacros.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-07-12 |
| Decisores | Product Owner, responsable de arquitectura, responsable de operación y responsable de datos |
| Consultados | Desarrollo, calidad, seguridad, soporte, responsables de módulos y negocio |
| Informados | Usuarios de releases, operación, soporte y responsables de producto |
| Propietario | Operación/Platform Engineering con corresponsabilidad de Producto, Arquitectura y Datos |
| Alcance | SLI, SLO, error budgets, disponibilidad, latencia, frescura, RPO, RTO, respaldos, restauración y gobierno |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; requiere baseline y simulacro antes de aceptación |
| Issues relacionados | Pendiente: instrumentación, catálogo SLI, PITR, backup de Storage, runbooks, synthetic checks y restore drill |

---

## 1. Resumen ejecutivo

CRUMAFOOD exige operación observable y recuperable, pero aún no dispone de línea base productiva, SLO medidos, error budgets ni restauraciones verificadas. Declarar compromisos estrictos sin esas capacidades produciría precisión falsa.

La decisión propuesta es:

> **CRUMAFOOD clasificará servicios y datos por criticidad; medirá SLO por resultados útiles en ventanas móviles de 28 días; iniciará con 99.5% de éxito para flujos transaccionales críticos y 99.0% para flujos importantes; y adoptará objetivos RPO/RTO distintos para PostgreSQL autoritativo, Storage, código/configuración y datos reconstruibles. Los valores serán objetivos internos, no SLA contractual, hasta validarse con telemetría, costo y simulacros.**

---

## 2. Contexto

La plataforma soporta pedidos, inventario, compras, producción, autenticación, integraciones, Mobile, Desktop y futuros procesos diferidos.

Los documentos de arquitectura ya requieren:

- disponibilidad proporcional al impacto;
- integridad antes que velocidad;
- restauración probada;
- medición por percentiles;
- observabilidad de flujos críticos;
- y recuperación ante despliegues o pérdida de datos.

ADR-0008 propone la plataforma inicial de observabilidad. Este ADR define qué resultados deberán medirse y recuperarse.

---

## 3. Estado actual

No existe evidencia verificable de:

- SLI calculados;
- SLO publicados;
- error budgets;
- burn-rate alerts;
- baseline de disponibilidad o latencia;
- PITR habilitado;
- backup independiente de Storage;
- restauración completa ensayada;
- ni medición real de RPO/RTO.

Los objetivos de este ADR son una hipótesis operativa que debe validarse.

---

## 4. Problema

Sin objetivos explícitos:

- confiabilidad significa cosas distintas para cada persona;
- toda degradación parece igualmente urgente;
- no existe criterio para frenar releases;
- no se sabe cuánto dato puede perderse;
- no se sabe cuánto puede tardar la recuperación;
- y el costo de mayor disponibilidad no puede evaluarse.

El sistema necesita objetivos comprensibles, medibles y proporcionales al negocio.

---

## 5. Alcance

Esta decisión cubre:

- taxonomía de criticidad;
- SLI y SLO iniciales;
- ventanas y poblaciones;
- error budgets;
- burn rate;
- objetivos de latencia y frescura;
- RPO y RTO por clase;
- backups y restauración;
- simulacros;
- respuesta al incumplimiento;
- y revisión.

No define:

- SLA comercial;
- compensaciones contractuales;
- soporte 24/7 definitivo;
- proveedor de backups externo;
- estrategia detallada de caché;
- continuidad multi-región;
- ni runbooks paso a paso.

---

## 6. Definiciones

| Término | Definición en CRUMAFOOD |
|---|---|
| SLI | Medición de un resultado útil para una población definida |
| SLO | Objetivo interno para un SLI durante una ventana |
| SLA | Compromiso contractual; queda fuera de este ADR |
| Error budget | Margen de resultados no buenos permitido por el SLO |
| RPO | Máxima antigüedad tolerable del punto recuperado |
| RTO | Tiempo objetivo para restaurar una capacidad útil y verificada |
| MTTD | Tiempo medio hasta detectar |
| MTTR | Tiempo medio hasta recuperar |

RPO no es frecuencia de backup y RTO no es tiempo hasta iniciar la investigación.

---

## 7. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Integridad de datos | Crítica | Ningún objetivo de disponibilidad justifica corrupción |
| Continuidad operativa | Crítica | Pedidos e inventario requieren recuperación prioritaria |
| Experiencia del usuario | Alta | Medir resultados, no solo infraestructura |
| Evidencia disponible | Crítica | Objetivos iniciales deben ser revisables |
| Costo | Alta | Mayor disponibilidad y menor RPO tienen costo |
| Capacidad de respuesta | Alta | Un objetivo sin propietario no es creíble |
| Proveedores administrados | Alta | Objetivos no pueden exceder capacidades contratadas sin plan |
| Simplicidad | Alta | Pocos SLO accionables inicialmente |
| Bajo volumen inicial | Alta | Combinar eventos, sintéticos y revisión manual |
| Evolución | Alta | Permitir objetivos distintos por módulo y etapa |

---

## 8. Restricciones

La decisión deberá respetar:

- PostgreSQL/Supabase como autoridad transaccional;
- Vercel como runtime Web actual;
- migraciones canónicas en `supabase/migrations/`;
- aislamiento multi-tenant;
- respaldos cifrados y acceso mínimo;
- restores en entorno aislado;
- datos sensibles fuera de telemetría;
- y cifras contractuales aprobadas por negocio y legal por separado.

---

## 9. Supuestos

La propuesta asume que:

- la operación principal estará inicialmente en México;
- el volumen productivo aún debe medirse;
- no existe guardia 24/7 formal;
- los servicios administrados continuarán siendo dependencias principales;
- la base y Storage requieren mecanismos de recuperación distintos;
- y los clientes offline pueden continuar trabajo limitado durante interrupciones.

Antes de Aceptado se confirmará cada supuesto material.

---

## 10. Criterios de decisión

| Criterio | Prioridad | Evaluación |
|---|---|---|
| Valor para usuario | Crítica | El indicador representa una tarea real |
| Integridad | Crítica | No clasifica un resultado corrupto como bueno |
| Medibilidad | Crítica | Fuente y fórmula verificables |
| Accionabilidad | Alta | El incumplimiento cambia una decisión |
| Costo | Alta | Objetivo sostenible con presupuesto |
| Recuperabilidad | Crítica | Simulacro demuestra RPO/RTO |
| Claridad | Alta | Producto y operación pueden interpretarlo |
| Resistencia a gaming | Alta | Exclusiones y población no ocultan fallos |

---

## 11. Opciones consideradas

| Opción | Resumen | Resultado |
|---|---|---|
| A | Objetivos por criticidad con baseline y revisión | Elegida |
| B | Un único 99.9% para toda la plataforma | No elegida |
| C | Copiar SLA de proveedores | No elegida |
| D | Esperar indefinidamente por datos perfectos | No elegida |
| E | No definir objetivos | No elegida |

---

## 12. Opción A — Objetivos por criticidad

Define pocos niveles, mide flujos reales y asigna recuperación según autoridad del dato.

Ventajas:

- alinea costo con impacto;
- permite empezar sin fingir madurez;
- hace explícitos los trade-offs;
- y produce una ruta hacia objetivos más estrictos.

Desventajas:

- exige catálogo, telemetría y gobierno;
- introduce decisiones sobre exclusiones;
- y requiere simulacros que consumen tiempo y recursos.

---

## 13. Opción B — Un único 99.9%

Aplicar la misma cifra a toda la plataforma es simple, pero ignora que confirmar una orden, abrir una vista analítica y reconstruir una proyección tienen impactos distintos.

Se descarta por precisión falsa y costo no gobernado.

---

## 14. Opción C — Copiar SLA de proveedores

El SLA de Vercel o Supabase describe responsabilidades del proveedor, no el éxito extremo a extremo de CRUMAFOOD.

Una aplicación puede fallar mientras ambos proveedores cumplen sus compromisos. Se descarta como sustituto de SLO propios.

---

## 15. Opción D — Esperar datos perfectos

No fijar ninguna dirección hasta acumular meses de telemetría perpetúa la ausencia de prioridades.

Se descarta. Se usarán objetivos provisionales con fecha y criterios de recalibración.

---

## 16. Decisión propuesta

CRUMAFOOD adoptará:

1. tres niveles de criticidad;
2. SLO por flujo y resultado útil;
3. ventana móvil primaria de 28 días;
4. objetivos iniciales de 99.5%, 99.0% o puntualidad según nivel;
5. latencia medida en percentiles;
6. error budget por SLO;
7. política de cambio basada en consumo;
8. RPO/RTO por clase de información;
9. restauraciones trimestrales inicialmente;
10. y recalibración después del baseline.

---

## 17. Niveles de criticidad

| Nivel | Nombre | Impacto típico | Ejemplos iniciales |
|---|---|---|---|
| T1 | Crítico transaccional | Detiene operación o compromete integridad | Login operativo, confirmar orden, movimientos de inventario |
| T2 | Importante | Degrada trabajo, existe alternativa limitada | Catálogo, compras, sincronización, webhooks recuperables |
| T3 | Diferible | Puede esperar o reconstruirse | Analítica, reportes, proyecciones no autoritativas |

Un flujo podrá subir o bajar de nivel mediante evidencia y aprobación.

---

## 18. Principio de integridad

Un resultado solo es bueno si:

- la operación fue autorizada;
- las invariantes se preservaron;
- la respuesta representa el estado confirmado;
- no hubo duplicación no controlada;
- y existe trazabilidad suficiente.

Responder rápido con datos incorrectos consume error budget y puede constituir incidente crítico.

---

## 19. Ventana de medición

La ventana primaria será móvil de 28 días.

También se observarán:

- 1 hora para incidentes rápidos;
- 6 horas para degradación;
- 24 horas para operación diaria;
- y trimestre para tendencia y capacidad.

La ventana de 28 días no impedirá actuar ante una caída inmediata.

---

## 20. Población de eventos

Cada SLO declarará:

- evento total;
- evento bueno;
- fuente;
- entorno;
- flujo;
- exclusiones;
- versión;
- y tratamiento de resultados desconocidos.

Los errores de instrumentación no se clasificarán silenciosamente como éxitos.

---

## 21. Exclusiones

Solo se excluirán eventos por reglas versionadas, por ejemplo:

- tráfico sintético identificado;
- pruebas autorizadas;
- requests maliciosos bloqueados;
- solicitudes inválidas antes de iniciar el flujo;
- y mantenimiento comunicado cuando la política lo permita.

Una dependencia caída, error de código o falta de capacidad no se excluirá por conveniencia.

---

## 22. SLO inicial de flujos T1

Los flujos T1 tendrán como objetivo provisional:

| Dimensión | Objetivo inicial |
|---|---|
| Éxito técnico e íntegro | **≥ 99.5%** en 28 días |
| Latencia servidor p95 | **≤ 2.5 s** para operación interactiva medida |
| Latencia servidor p99 | Se mide; objetivo tras baseline |
| Detección de caída amplia | **≤ 10 min** cuando la señal esté habilitada |

El 99.5% deja un error budget de 0.5% de los eventos elegibles. No constituye SLA.

---

## 23. SLO inicial de flujos T2

Los flujos T2 tendrán como objetivo provisional:

| Dimensión | Objetivo inicial |
|---|---|
| Éxito técnico | **≥ 99.0%** en 28 días |
| Latencia servidor p95 | **≤ 4 s** para operación interactiva medida |
| Recuperación por retry | Dentro de la ventana específica del flujo |

Los retries no convertirán un primer efecto duplicado o corrupto en éxito.

---

## 24. Objetivos T3

Los flujos T3 priorizarán puntualidad y frescura sobre disponibilidad instantánea.

Objetivos provisionales:

- **≥ 99.0%** de ejecuciones programadas dentro de su ventana;
- proyección reconstruible sin pérdida de hechos autoritativos;
- y retraso visible para el usuario cuando exceda el umbral.

Cada job o proyección definirá su propia ventana.

---

## 25. Login

El SLI de login medirá sesiones válidas que alcanzan un estado autenticado utilizable.

No será suficiente medir solo respuesta del endpoint de Auth.

Objetivo inicial:

- éxito **≥ 99.5%** en 28 días;
- p95 de flujo medido **≤ 3 s**, excluyendo interacción humana y entrega externa de correo;
- y señal separada para proveedor SMTP u OAuth.

---

## 26. Confirmación de orden

Una confirmación será buena si:

- valida entradas;
- autoriza;
- persiste exactamente una vez en términos de negocio;
- registra movimientos relacionados requeridos;
- y devuelve estado confirmado.

Objetivo inicial:

- éxito íntegro **≥ 99.5%**;
- p95 servidor **≤ 2.5 s**;
- y reconciliación sin discrepancias críticas conocidas.

---

## 27. Inventario

Los movimientos de inventario priorizan integridad sobre disponibilidad.

Objetivos iniciales:

- éxito íntegro **≥ 99.5%** para comandos válidos;
- cero cruces de tenant aceptables;
- cero movimientos duplicados no reconciliados aceptables;
- y disponibilidad derivada con frescura documentada.

Los objetivos cero expresan tolerancia de negocio, no garantía matemática de ausencia de incidentes.

---

## 28. Catálogo y lectura

Las lecturas T2 usarán como objetivo inicial:

- éxito **≥ 99.0%**;
- p95 servidor **≤ 2 s** para consultas paginadas principales;
- y estado de frescura explícito cuando exista caché o proyección.

Una respuesta vacía por error de RLS o tenant no se contará como éxito.

---

## 29. Sincronización offline

La sincronización medirá comandos aceptados, rechazados, pendientes y reconciliados.

Objetivos provisionales después de recuperar conectividad estable:

- **≥ 99.0%** de comandos válidos procesados sin intervención;
- p95 de edad de cola **≤ 5 min** bajo carga nominal;
- y ningún comando crítico perdido silenciosamente.

Conflictos de negocio explícitos no son fallos técnicos si llegan al estado resoluble previsto.

---

## 30. Webhooks e integraciones

Cada integración definirá éxito extremo a extremo, timeout y ventana de retry.

Objetivos iniciales:

- recepción válida **≥ 99.0%**;
- procesamiento o encolado durable dentro de **5 min** en p95;
- e idempotencia verificada.

La caída del tercero consume el SLO de experiencia si afecta al usuario, aunque se atribuya por separado.

---

## 31. Jobs

Un job será bueno si:

- inicia dentro de su ventana;
- evita solapamiento indebido;
- procesa el alcance esperado;
- registra resultado durable;
- y termina o escala el fallo.

Objetivo inicial: **≥ 99.0%** de ejecuciones correctas y puntuales en 28 días.

---

## 32. Disponibilidad percibida

La disponibilidad se medirá por flujos válidos, no por `GET /api/health` únicamente.

Se combinarán cuando sea posible:

- tráfico real;
- pruebas sintéticas seguras;
- estado de dependencias;
- y resultados de negocio agregados.

Health demuestra señal mínima, no disponibilidad útil.

---

## 33. Latencia

La latencia usará percentiles, no promedios aislados.

Cada medición declarará:

- inicio y fin;
- cliente o servidor;
- región;
- dataset;
- cache hit/miss cuando aplique;
- y timeout.

Los objetivos p95 de este ADR se recalibrarán tras 28 días representativos.

---

## 34. Frescura

Toda proyección, caché o réplica declarará:

- fuente autoritativa;
- última actualización exitosa;
- edad máxima esperada;
- umbral de degradación;
- y procedimiento de reconstrucción.

Mostrar datos obsoletos sin indicarlo será un resultado malo cuando pueda cambiar una decisión operativa.

---

## 35. Error budgets

Para SLO basados en eventos:

```text
error_budget = 1 - objetivo
consumo = eventos_no_buenos / eventos_totales
```

Ejemplos:

- 99.5% permite 0.5% de eventos no buenos;
- 99.0% permite 1.0% de eventos no buenos.

Los presupuestos no autorizan pérdida, corrupción, fuga multi-tenant o vulneraciones de seguridad.

---

## 36. Política de consumo

| Estado | Condición orientativa | Respuesta |
|---|---|---|
| Verde | Consumo ≤ 50% | Entrega normal y mejora preventiva |
| Amarillo | Consumo > 50% | Revisar tendencia y cambios riesgosos |
| Rojo | Consumo ≥ 100% | Priorizar confiabilidad y limitar releases no esenciales |
| Incidente crítico | Integridad, seguridad o caída amplia | Contener y recuperar sin esperar cierre de ventana |

La suspensión no bloqueará parches de seguridad ni correcciones de confiabilidad.

---

## 37. Burn rate

Cuando el volumen sea suficiente, se alertará por consumo acelerado en varias ventanas.

Se distinguirán:

- incidente rápido;
- degradación sostenida;
- y tendencia lenta.

Flujos de bajo volumen usarán eventos críticos, synthetic checks y revisión diaria en lugar de estadísticas engañosas.

---

## 38. Clases de recuperación

| Clase | Contenido | Estrategia |
|---|---|---|
| D1 | PostgreSQL autoritativo, Auth relacionado, auditoría, outbox | PITR/backup probado y restauración gobernada |
| D2 | Objetos de Storage necesarios para operación | Backup independiente y catálogo de integridad |
| D3 | Código, migraciones y configuración declarativa no secreta | Git, artefactos y copia externa gobernada |
| D4 | Cachés, índices, vistas y proyecciones reconstruibles | Rebuild desde autoridad |
| D5 | Telemetría y evidencia operativa | Retención del proveedor y exportación según necesidad |

---

## 39. Objetivos RPO/RTO iniciales

| Clase | RPO objetivo | RTO objetivo | Condición |
|---|---:|---:|---|
| D1 — datos autoritativos | **≤ 15 min** | **≤ 4 h** | Requiere PITR o mecanismo equivalente y restore drill |
| D2 — Storage operativo | **≤ 24 h** | **≤ 8 h** | Requiere backup fuera del bucket primario |
| D3 — código/config declarativa | **≈ 0** tras push | **≤ 2 h** | Repositorio, artefacto y credenciales disponibles |
| D4 — reconstruibles | No aplica a pérdida autoritativa | **≤ 8 h** | Tiempo de rebuild medido |
| D5 — telemetría | **≤ 24 h** tolerable inicialmente | **≤ 24 h** | No bloquea transacciones |

Estos objetivos son internos y comienzan cuando el incidente es detectado y declarado.

---

## 40. PostgreSQL autoritativo

El RPO de 15 minutos no puede demostrarse con un único backup diario.

Antes de Aceptado se deberá:

- habilitar PITR o mecanismo equivalente;
- confirmar el punto recuperable más reciente;
- documentar retención;
- medir restore real;
- validar migraciones, funciones y RLS;
- y comprobar integridad funcional.

Si el costo no se aprueba, el objetivo deberá rebajarse de forma explícita; no se declarará cumplido.

---

## 41. Storage

Los backups de PostgreSQL no incluyen automáticamente los objetos de Supabase Storage.

La estrategia D2 deberá conservar:

- objetos;
- buckets y políticas;
- metadatos y relación con registros;
- checksums cuando aplique;
- cifrado;
- y procedimiento de restauración.

Restaurar solo filas sin archivos relacionados no satisface RTO.

---

## 42. Auth y configuración administrada

La recuperación cubrirá, según aplique:

- usuarios y relaciones almacenadas;
- configuración de proveedores;
- URLs permitidas;
- plantillas;
- SMTP;
- secretos rotables;
- extensiones;
- Realtime;
- y settings fuera del backup físico.

Se mantendrá inventario declarativo o runbook para elementos que el proveedor no restaure.

---

## 43. Código y migraciones

El repositorio Git será la autoridad de:

- código fuente;
- migraciones;
- documentación;
- configuración declarativa no secreta;
- y runbooks.

Se conservará un backup recuperable del repositorio y se probará restauración sin depender de una única cuenta personal.

---

## 44. Datos reconstruibles

Cachés, vistas materializadas y proyecciones no serán respaldadas como autoridad cuando puedan regenerarse de forma segura.

Cada una tendrá:

- fuente;
- versión de esquema;
- comando de rebuild;
- checkpoint;
- verificación;
- y duración esperada.

El rebuild no bloqueará indefinidamente la operación T1.

---

## 45. Backup válido

Un backup será válido solo si:

- fue completado;
- es legible;
- está cifrado;
- su alcance es conocido;
- existe fuera del fallo que pretende cubrir;
- tiene retención verificable;
- y fue restaurado con éxito dentro del periodo de prueba.

Una marca verde del proveedor sin restore no es evidencia suficiente.

---

## 46. Restauración aislada

Las pruebas se ejecutarán en un entorno aislado y autorizado.

Validarán:

- esquema y migraciones;
- datos y relaciones;
- tenants y RLS;
- funciones;
- Auth;
- Storage;
- auditoría y outbox;
- integraciones deshabilitadas por defecto;
- y smoke tests de flujos críticos.

No se enviarán correos, webhooks o pagos reales durante un drill.

---

## 47. Frecuencia de simulacros

Frecuencia inicial propuesta:

- restore de D1: trimestral;
- muestra y catálogo de D2: trimestral;
- recuperación de repositorio D3: semestral;
- rebuild D4: por cambio material y al menos semestral;
- tabletop de desastre: semestral;
- y drill adicional después de una modificación material del proveedor o backup.

La frecuencia podrá aumentar con criticidad, contrato o incidentes.

---

## 48. Medición de RPO

En cada simulacro se registrará:

- timestamp del último dato confirmado antes del incidente simulado;
- timestamp del punto restaurado;
- diferencia real;
- transacciones ausentes;
- y reconciliación necesaria.

La granularidad declarada por el proveedor no sustituye el RPO observado.

---

## 49. Medición de RTO

El reloj de RTO incluirá:

1. detección;
2. declaración;
3. acceso y decisión;
4. provisión;
5. restauración;
6. configuración;
7. verificación de integridad;
8. smoke tests;
9. y apertura segura al usuario.

No terminará cuando la base simplemente acepte conexiones.

---

## 50. Dependencias y proveedores

Los SLO internos no copiarán automáticamente compromisos de terceros.

Se mantendrá para cada proveedor:

- SLA o disponibilidad publicada según contrato;
- límites y exclusiones;
- soporte;
- región;
- historial de incidentes relevante;
- procedimiento de escalamiento;
- y alternativa operativa.

El fallo de un proveedor se atribuye, pero continúa afectando el SLO percibido cuando impacta al usuario.

---

## 51. Cobertura operativa

Los objetivos se medirán continuamente, pero no se presentarán como garantía de respuesta 24/7 mientras no exista guardia formal.

Antes de Aceptado se definirá:

- horario de cobertura;
- contacto primario y suplente;
- severidades;
- tiempo de acuse;
- autoridad para restaurar;
- y comunicación fuera de horario.

La diferencia entre objetivo técnico y capacidad humana será visible.

---

## 52. Observabilidad requerida

ADR-0008 y la arquitectura de observabilidad deberán habilitar:

- eventos buenos y totales;
- latencia por percentil;
- entorno y release;
- flujos T1/T2/T3;
- error budget;
- burn rate;
- edad de datos;
- estado de backups;
- y duración de restores.

No se capturarán datos sensibles para calcular confiabilidad.

---

## 53. Alertas

Las alertas prioritarias serán:

- caída amplia T1;
- burn rate acelerado;
- pérdida de integridad;
- backup fallido;
- punto recuperable fuera de RPO;
- restore drill fallido;
- proyección fuera de frescura;
- y job crítico fuera de ventana.

Cada alerta tendrá propietario y runbook.

---

## 54. CI/CD y releases

ADR-0007 usará el estado del error budget para informar promoción.

Cuando el presupuesto esté agotado:

- se limitarán releases no esenciales;
- se permitirán correcciones de seguridad y confiabilidad;
- se reducirá alcance;
- se reforzarán smoke tests;
- y Producto participará en la decisión de riesgo.

No se automatizará un freeze irreversible sin vía de excepción documentada.

---

## 55. Incidentes

Todo incidente T1 registrará:

- SLO afectados;
- error budget consumido;
- MTTD;
- MTTR;
- RPO/RTO observado cuando aplique;
- datos o tenants afectados;
- contención;
- recuperación;
- y acciones de aprendizaje.

Un incidente de integridad requiere revisión aunque el porcentaje mensual permanezca verde.

---

## 56. Consecuencias positivas

- lenguaje común entre Producto y Operación;
- prioridades proporcionales al impacto;
- releases gobernadas por evidencia;
- recuperación medible;
- costos de confiabilidad visibles;
- backups tratados como capacidad comprobable;
- y objetivos revisables sin convertirlos prematuramente en contratos.

---

## 57. Consecuencias negativas

- instrumentación y gobierno adicionales;
- costo potencial de PITR y backup de Storage;
- tiempo periódico para simulacros;
- riesgo de interpretar cifras provisionales como promesa;
- necesidad de mantener catálogos y exclusiones;
- y presión para mejorar objetivos antes de tener capacidad humana.

---

## 58. Riesgos y controles

| Riesgo | Control |
|---|---|
| Objetivos inventados | Estado Propuesto, baseline y recalibración |
| Gaming de exclusiones | Revisión y versionado |
| Error budget oculta integridad | Incidentes de integridad fuera del presupuesto normal |
| PITR no contratado | Gate de aceptación y evidencia de plan |
| Storage sin respaldo | Estrategia D2 independiente |
| Restore demasiado lento | Simulacros y medición extremo a extremo |
| Dependencia de una persona | Roles, suplentes y acceso probado |
| Alert fatigue | Pocas alertas basadas en impacto |
| Bajo volumen | Sintéticos y evaluación por eventos críticos |
| SLA confundido con SLO | Etiquetado explícito y revisión contractual separada |

---

## 59. Plan de implementación

### Fase 0 — Catálogo

- confirmar flujos T1/T2/T3;
- definir propietarios;
- registrar fórmulas;
- y aprobar objetivos provisionales.

### Fase 1 — Baseline

- instrumentar eventos buenos y totales;
- medir 28 días representativos;
- segmentar releases y entornos;
- y comprobar calidad de datos.

### Fase 2 — Error budgets

- calcular presupuestos;
- crear dashboards;
- configurar alertas;
- y ensayar política de releases.

### Fase 3 — Recuperación

- confirmar plan de Supabase;
- habilitar mecanismo D1;
- implementar backup D2;
- documentar configuración;
- y ejecutar restore aislado.

### Fase 4 — Recalibración

- comparar objetivos con baseline, costo y drills;
- ajustar mediante revisión;
- y solicitar aceptación.

---

## 60. Criterios para Aceptado

Este ADR podrá pasar a Aceptado cuando:

- Producto confirme criticidad y tolerancia;
- cada SLO tenga fórmula, fuente y propietario;
- exista baseline representativo;
- los objetivos sean alcanzables o exista plan financiado;
- ADR-0008 entregue señales suficientes;
- PITR o equivalente demuestre RPO D1;
- Storage tenga respaldo verificable;
- un restore completo cumpla o mida RTO;
- se prueben RLS, integridad y smoke tests;
- exista cobertura operativa definida;
- y la política de error budget esté aprobada.

---

## 61. Preguntas abiertas

Antes de Aceptado se resolverá:

- ¿cuáles flujos son realmente T1 por contrato y operación?;
- ¿qué horarios necesitan respuesta humana?;
- ¿qué plan de Supabase está contratado?;
- ¿se aprueba el costo de PITR?;
- ¿qué objetos de Storage son irremplazables?;
- ¿qué herramienta ejecutará synthetic checks?;
- ¿qué canal y suplente reciben P1?;
- ¿qué baseline existe por región y tenant?;
- ¿qué exclusiones son legítimas?;
- y ¿qué objetivos se comunicarán externamente?

---

## 62. Métricas de la decisión

Se seguirá:

- cobertura de flujos con SLI;
- SLO cumplidos;
- error budget consumido;
- MTTD y MTTR;
- porcentaje de backups exitosos;
- edad del último punto recuperable;
- RPO y RTO observados;
- drills aprobados;
- restauraciones con integridad;
- y costo mensual de confiabilidad.

---

## 63. Triggers de revisión

Este ADR se revisará cuando:

- exista un SLA contractual;
- cambie la criticidad de un flujo;
- se incorpore pago real;
- se adopte operación 24/7;
- cambie el plan o proveedor;
- un incidente exceda RPO/RTO;
- dos ventanas consecutivas incumplan SLO;
- se incorpore multi-región;
- el volumen cambie un orden de magnitud;
- o el costo de confiabilidad sea insostenible.

---

## 64. Registro de aprobación

| Rol | Estado | Evidencia |
|---|---|---|
| Product Owner | Pendiente | Criticidad, impacto y presupuesto |
| Arquitectura | Pendiente | Modelo SLI/SLO y coherencia |
| Operación | Pendiente | Alertas, cobertura y drills |
| Datos | Pendiente | RPO, backup y restore |
| Seguridad | Pendiente | Accesos, cifrado y datos restaurados |
| Desarrollo | Pendiente | Instrumentación y pruebas |

El texto no equivale a aprobación.

---

## 65. Historial

| Fecha | Cambio |
|---|---|
| 2026-07-12 | Creación de la propuesta ADR-0009 |

---

## 66. Referencias

- [Arquitectura de observabilidad](../observability-architecture.md)
- [Arquitectura de despliegue](../deployment-architecture.md)
- [Arquitectura de datos](../data-architecture.md)
- [Arquitectura de rendimiento](../performance-architecture.md)
- [Arquitectura multi-tenant](../multi-tenancy-architecture.md)
- [ADR-0002 — Baseline y migraciones](0002-schema-baseline-and-migrations.md)
- [ADR-0005 — Estrategia offline](0005-offline-sync-strategy.md)
- [ADR-0007 — Pipeline CI/CD](0007-ci-cd-pipeline.md)
- [ADR-0008 — Proveedor de observabilidad](0008-observability-provider.md)
- [Google SRE — Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Google SRE — Error Budget Policy](https://sre.google/workbook/error-budget-policy/)
- [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase — Restore to a New Project](https://supabase.com/docs/guides/platform/clone-project)
- [GitHub — Backing up a repository](https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository)

Las capacidades de proveedores se verificaron el 2026-07-12 y deberán confirmarse contra el plan contratado antes de aceptación.

---

## 67. Resultado de la propuesta

La propuesta crea una base cuantitativa sin confundir objetivos internos con garantías contractuales.

La confiabilidad se medirá desde tareas reales; los cambios responderán al error budget; y la recuperación se considerará válida únicamente después de restaurar, verificar integridad y reabrir el servicio de forma segura.

---

## 68. Declaración final

> **CRUMAFOOD no prometerá disponibilidad ni recuperación por intuición: medirá resultados útiles, aceptará márgenes explícitos y demostrará mediante simulacros cuánto dato puede recuperar y cuánto tarda en devolver una operación íntegra.**
