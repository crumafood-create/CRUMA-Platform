# ADR-0015: Adoptar backups multicapa y restauración verificada

> **Propuesta:** proteger Production mediante PITR para PostgreSQL, copias lógicas y de objetos fuera del dominio de fallo primario, configuración reconstruible desde Git y simulacros periódicos de restauración completa y por tenant.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-07-12 |
| Decisores | Product Owner, responsable de arquitectura, responsable de datos, responsable de seguridad y responsable de operación |
| Consultados | Desarrollo, calidad, soporte, integraciones, finanzas y responsables de módulos |
| Informados | Usuarios de releases y administradores de Supabase, GitHub, Vercel y almacenamiento de respaldo |
| Propietario | Platform Engineering/Operación, con corresponsabilidad de Datos y Seguridad |
| Alcance | PostgreSQL, Auth, Storage, código, migraciones, configuración, secretos, integraciones, telemetría, backups, restauración y simulacros |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; requiere piloto técnico y aprobación de costo antes de aceptación |
| Issues relacionados | Pendiente: PITR, destino externo, jobs, cifrado, retención, runbooks, alertas y restore drills |

---

## 1. Resumen ejecutivo

CRUMAFOOD tiene objetivos provisionales de recuperación, pero todavía no existe evidencia de PITR contratado, copia externa de Storage, retención aplicada ni restauraciones ensayadas.

La decisión propuesta es:

> **CRUMAFOOD usará una estrategia multicapa. Production tendrá PITR para datos autoritativos, exportaciones lógicas cifradas en un dominio de fallo independiente, copia separada de objetos de Storage, código y configuración declarativa en Git con réplica recuperable, y simulacros en un entorno aislado. Un backup solo contará como válido después de verificarse mediante restauración.**

PITR permitirá cumplir el RPO de datos transaccionales. La copia externa protegerá frente a pérdida de proyecto, cuenta, proveedor o credenciales. Ninguna capa sustituye por sí sola a las demás.

---

## 2. Contexto

La plataforma depende o dependerá de:

- PostgreSQL como autoridad transaccional;
- Auth y sus relaciones;
- objetos y metadatos de Storage;
- migraciones y Edge Functions;
- configuración administrada de Supabase;
- secretos e integraciones externas;
- código alojado en GitHub;
- y servicios desplegados en Vercel, Tauri u otros destinos.

Cada componente tiene un mecanismo de recuperación diferente.

---

## 3. Estado actual

Los documentos de arquitectura declaran:

- RPO D1 de hasta 15 minutos;
- RTO D1 de hasta 4 horas;
- RPO D2 de hasta 24 horas;
- RTO D2 de hasta 8 horas;
- backups diarios, snapshots semanales y archivos mensuales como intención;
- respaldo independiente de Storage;
- y restauraciones trimestrales iniciales.

No se identificó evidencia de que esas capacidades estén implementadas o medidas.

---

## 4. Problema

Confiar exclusivamente en el backup administrado de base de datos no cubre:

- objetos de Storage;
- configuración de Auth;
- API keys y secretos;
- Edge Functions;
- configuración de Realtime;
- errores o pérdida del proyecto completo;
- compromiso de la cuenta del proveedor;
- ni recuperación selectiva de un tenant.

Confiar exclusivamente en un dump diario tampoco satisface un RPO de 15 minutos.

---

## 5. Alcance

Esta decisión cubre:

- clases de información;
- capas de backup;
- frecuencia y retención iniciales;
- dominios de fallo;
- cifrado y acceso;
- monitoreo;
- restauración completa;
- restauración a un punto en el tiempo;
- recuperación de objetos;
- recuperación por tenant;
- simulacros;
- evidencia;
- y criterios de aceptación.

---

## 6. Fuera de alcance

Este ADR no elige:

- proveedor definitivo de almacenamiento externo;
- región definitiva de cada copia;
- herramienta comercial de backup;
- obligaciones fiscales o legales no confirmadas;
- retención contractual por cliente;
- ni comandos finales del runbook.

Esas decisiones deberán respetar este modelo y documentarse antes de Production.

---

## 7. Definiciones

| Término | Significado |
|---|---|
| Backup | Copia protegida destinada a recuperación |
| Restore | Proceso de materializar una copia en un entorno utilizable |
| PITR | Recuperación de PostgreSQL a un punto elegido en el tiempo |
| RPO | Antigüedad máxima tolerable del punto recuperado |
| RTO | Tiempo objetivo hasta reabrir una capacidad útil y verificada |
| Retención | Periodo durante el cual una copia puede recuperarse |
| Dominio de fallo | Cuenta, proveedor, región o credencial cuya pérdida puede afectar recursos relacionados |
| Drill | Simulacro controlado de restauración |
| Inmutabilidad | Protección que impide alterar o borrar una copia durante un periodo definido |

RPO no equivale a frecuencia de backup. RTO no termina cuando la base acepta conexiones.

---

## 8. Principios

1. un backup no probado es una hipótesis;
2. la copia debe sobrevivir al fallo que pretende cubrir;
3. Production no se restaura primero sobre sí mismo;
4. base de datos y objetos requieren mecanismos distintos;
5. secretos no se guardan en Git ni en backups sin protección apropiada;
6. toda restauración preserva aislamiento multi-tenant;
7. el acceso a backups es más restringido que el acceso ordinario de desarrollo;
8. la recuperación deshabilita efectos externos hasta validar;
9. retención y costo son explícitos;
10. y RPO/RTO se demuestran con medición.

---

## 9. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Integridad de datos | Crítica | Restauración consistente y reconciliable |
| Aislamiento de tenant | Crítica | Cero datos cruzados |
| RPO D1 | Crítica | PITR o equivalente |
| Storage | Crítica | Copia de objetos fuera del bucket primario |
| Seguridad | Crítica | Cifrado, MFA, mínimo privilegio e inmutabilidad |
| Dependencia de proveedor | Alta | Copia independiente y runbook portable |
| Operabilidad | Alta | Automatización, alertas y owners |
| Costo | Alta | Retención escalonada y revisión de volumen |
| Auditabilidad | Alta | Evidencia de jobs, drills y autorizaciones |

---

## 10. Restricciones

La estrategia deberá respetar:

- los objetivos de ADR-0009;
- las migraciones canónicas de ADR-0002;
- la separación de entornos de ADR-0014;
- el aislamiento lógico de ADR-0001;
- la autorización de ADR-0003;
- la promoción de ADR-0007;
- privacidad y residencia aplicables;
- y el principio de no usar datos productivos en Preview o CI.

---

## 11. Supuestos

La propuesta asume que:

- Production usará un plan Supabase compatible con PITR;
- será posible aprovisionar almacenamiento cifrado en otro dominio de fallo;
- el volumen inicial permitirá copias lógicas diarias;
- las migraciones y funciones estarán versionadas;
- y existirán responsables operativos con acceso de emergencia gobernado.

Si un supuesto falla, el ADR deberá revisarse antes de marcarse Aceptado.

---

## 12. Criterios de evaluación

Las opciones se comparan por:

1. cumplimiento de RPO/RTO;
2. cobertura de PostgreSQL, Auth y Storage;
3. resistencia a pérdida de cuenta o proveedor;
4. seguridad;
5. recuperación por tenant;
6. automatización;
7. verificabilidad;
8. portabilidad;
9. costo;
10. y complejidad operativa.

---

## 13. Opciones consideradas

| Opción | Descripción |
|---|---|
| A | PITR + copias externas + configuración declarativa + drills |
| B | Solo backups y PITR administrados por Supabase |
| C | Solo dumps y copias externas programadas |
| D | Backups manuales bajo demanda |

---

## 14. Opción A: estrategia multicapa

Combina recuperación rápida del proveedor con copias portables e independientes.

Ventajas:

- satisface mejor RPO D1;
- cubre objetos y configuración omitidos por el backup de base;
- reduce el riesgo de fallo común;
- y permite pruebas sin sobrescribir Production.

Desventajas:

- mayor costo;
- más credenciales y automatización;
- y responsabilidad operativa continua.

---

## 15. Opción B: solo proveedor

Usa exclusivamente PITR y backups administrados por Supabase.

Se rechaza como estrategia completa porque:

- Storage no forma parte del backup de base de datos;
- una pérdida de proyecto puede compartir dominio de fallo con sus backups;
- y varias configuraciones requieren reaprovisionamiento manual.

PITR sí se conserva como una capa esencial.

---

## 16. Opción C: solo copias externas

Usa dumps lógicos y copia de objetos sin PITR.

Se rechaza como estrategia principal porque un dump diario puede perder hasta un día de transacciones y no demuestra el RPO D1 de 15 minutos.

La copia externa sí se conserva como defensa ante fallo catastrófico.

---

## 17. Opción D: backups manuales

Se rechaza porque depende de memoria humana, no garantiza frecuencia, carece de alerta y no escala con el crecimiento de datos.

Los backups manuales solo se permitirán como copia adicional antes de una operación extraordinaria.

---

## 18. Decisión

Se propone adoptar la **opción A: estrategia multicapa**.

La estrategia tendrá cuatro capas:

1. PITR de PostgreSQL para recuperación operacional fina;
2. copia lógica cifrada fuera del dominio primario;
3. copia independiente de objetos de Storage;
4. código, migraciones, configuración y runbooks reconstruibles desde Git y repositorios protegidos.

---

## 19. Estado honesto de la decisión

Este ADR no declara que los backups existan.

Permanecerá Propuesto hasta que:

- se apruebe presupuesto;
- se implemente un piloto;
- se documenten destinos y responsables;
- se complete al menos un restore drill;
- y se mida RPO/RTO.

---

## 20. Clases de recuperación

| Clase | Contenido | Mecanismo principal |
|---|---|---|
| D1 | PostgreSQL autoritativo, Auth relacionado, auditoría y outbox | PITR + copia lógica externa |
| D2 | Objetos operativos de Storage | Copia externa de objetos + manifiesto |
| D3 | Código, migraciones y configuración no secreta | Git + réplica recuperable |
| D4 | Cachés, índices y proyecciones reconstruibles | Rebuild desde D1 |
| D5 | Telemetría y evidencia operativa | Retención del proveedor y exportación selectiva |

---

## 21. Objetivos de recuperación

| Clase | RPO inicial | RTO inicial |
|---|---:|---:|
| D1 | ≤ 15 min | ≤ 4 h |
| D2 | ≤ 24 h | ≤ 8 h |
| D3 | ≈ 0 después de push | ≤ 2 h |
| D4 | No aplica a pérdida autoritativa | ≤ 8 h |
| D5 | ≤ 24 h tolerable inicialmente | ≤ 24 h |

Estos valores son objetivos internos provisionales, no SLA contractual.

---

## 22. Política por entorno

| Entorno | Política |
|---|---|
| Local | Sin backup; se reconstruye desde Git y seeds |
| CI | Sin backup; efímero y sintético |
| Preview | Sin backup; data-less y descartable |
| Development | Backup proporcional solo si contiene trabajo no reconstruible |
| Staging | Copia suficiente para drills; nunca reemplaza el backup de Production |
| Production | Estrategia completa de este ADR |

Ningún entorno no productivo recibirá una copia productiva sin autorización, sanitización y controles específicos.

---

## 23. Dominios de fallo

La estrategia buscará:

- tres representaciones de los datos cuando sea viable;
- al menos dos mecanismos o medios;
- y al menos una copia fuera de la cuenta o dominio primario.

El destino externo tendrá credenciales, política de borrado y control de acceso independientes del proyecto Supabase productivo.

---

## 24. PostgreSQL autoritativo

PostgreSQL contendrá la autoridad de:

- transacciones de negocio;
- membresías y permisos persistidos;
- auditoría;
- outbox e inbox;
- metadatos de Storage;
- y datos Auth almacenados en esquemas incluidos.

La restauración verificará esquemas internos y de aplicación, no solo `public`.

---

## 25. PITR

Production habilitará PITR o una capacidad equivalente que permita seleccionar un punto recuperable con granularidad suficiente para demostrar RPO D1.

La operación monitoreará:

- punto recuperable más antiguo;
- punto recuperable más reciente;
- ventana configurada;
- estado del servicio;
- y restauraciones fallidas.

La granularidad anunciada no reemplaza la medición del RPO observado.

---

## 26. Ventana PITR

Se propone inicialmente una ventana de **7 días**, sujeta a:

- aprobación de costo;
- patrón de errores detectados;
- volumen de WAL;
- obligaciones contractuales;
- y resultado de simulacros.

Errores detectados después de esa ventana dependerán de la copia lógica externa.

---

## 27. Restauración PITR

La restauración ordinaria preferirá crear un proyecto nuevo o aislado cuando la capacidad del proveedor lo permita.

Restaurar sobre Production requerirá:

- incidente declarado;
- autorización de Operación y Datos;
- punto objetivo documentado;
- evaluación de transacciones posteriores;
- plan de reconciliación;
- y comunicación de downtime.

---

## 28. Copia lógica externa

Se generará una exportación lógica cifrada de Production al menos una vez al día.

La copia será:

- automatizada;
- versionada por timestamp;
- almacenada fuera del dominio primario;
- acompañada de checksum y manifiesto;
- y restaurable con versiones compatibles de PostgreSQL y herramientas.

No se usará como único mecanismo de RPO D1.

---

## 29. Alcance de la copia lógica

El job deberá identificar explícitamente:

- esquema;
- datos;
- roles y grants recuperables;
- funciones y triggers;
- extensiones requeridas;
- schemas `auth` y `storage` aplicables;
- historial de migraciones;
- y objetos excluidos con justificación.

Las contraseñas de roles y secretos externos se recuperarán por mecanismos separados.

---

## 30. Consistencia de la base

La exportación deberá producir un punto consistente.

Si tablas, objetos o integraciones cambian durante la copia:

- se conservará el timestamp de inicio y fin;
- se documentará la semántica del snapshot;
- se asociará el manifiesto de Storage;
- y se definirá reconciliación entre D1 y D2.

---

## 31. Auth

La recuperación de Auth distinguirá:

- usuarios, identidades y hashes almacenados en base;
- configuración de proveedores;
- URLs permitidas;
- plantillas;
- SMTP;
- MFA y SSO;
- API keys;
- y secretos de firma.

Los primeros podrán viajar con la base según el mecanismo. Los demás deberán reconfigurarse desde inventario seguro o runbook.

---

## 32. Storage

Los objetos de Supabase Storage se respaldarán por separado de PostgreSQL.

La copia incluirá:

- contenido de cada objeto protegido;
- bucket y ruta;
- tamaño;
- tipo de contenido;
- versión o ETag cuando exista;
- checksum calculado;
- timestamps relevantes;
- y vínculo lógico con el tenant.

Copiar solo la tabla de metadatos no recupera los archivos.

---

## 33. Manifiesto de Storage

Cada ejecución generará un manifiesto que permita:

- contar objetos;
- detectar faltantes;
- verificar checksums;
- identificar duplicados;
- comparar metadatos;
- y reconciliar referencias de base de datos.

El manifiesto estará cifrado y tendrá la misma protección de acceso que los objetos.

---

## 34. Frecuencia de Storage

La copia de objetos se ejecutará al menos diariamente para satisfacer D2.

Si un flujo exige menor RPO:

- usará replicación o eventos de copia;
- documentará consistencia;
- medirá egress;
- y actualizará ADR-0009.

La frecuencia real se ajustará al volumen y criticidad de cada bucket.

---

## 35. Eliminaciones de objetos

Una eliminación en el bucket primario no deberá borrar inmediatamente todas las copias recuperables.

El destino aplicará:

- versionado o retención equivalente;
- borrado diferido;
- protección frente a propagación accidental;
- y proceso autorizado de purga por privacidad.

---

## 36. Código y migraciones

Git será autoridad de:

- código fuente;
- `supabase/migrations/`;
- configuración declarativa no secreta;
- Edge Functions;
- pruebas;
- documentación;
- y runbooks.

Un backup de datos no sustituye la reconstrucción reproducible desde el repositorio.

---

## 37. Respaldo del repositorio

El repositorio tendrá una réplica recuperable que no dependa de una única cuenta personal.

La copia deberá conservar:

- todas las ramas necesarias;
- tags;
- historia Git;
- releases o artefactos críticos;
- y verificación periódica de clonación.

Issues, Pull Requests y configuración de GitHub requerirán exportación o inventario separado si son necesarios para recuperación.

---

## 38. Configuración administrada

Se mantendrá un inventario versionado, sin secretos, de:

- proyectos y regiones;
- extensiones;
- Auth;
- Realtime;
- Storage buckets y políticas;
- Edge Functions;
- dominios y redirects;
- webhooks;
- jobs programados;
- y restricciones de red.

Lo que no sea declarativo tendrá pasos verificables en el runbook.

---

## 39. Secretos y claves

Los secretos no se incluirán en dumps, logs, manifestos ni Git en texto claro.

La recuperación dependerá de:

- secret manager autorizado;
- copia segura o procedimiento de regeneración;
- owners;
- rotación posterior al incidente;
- y acceso break-glass auditado.

Una restauración en proyecto nuevo usará credenciales nuevas cuando sea posible.

---

## 40. Integraciones externas

El inventario de recuperación incluirá:

- proveedor;
- endpoint;
- tenant o cuenta asociada;
- modo sandbox;
- secreto requerido;
- idempotencia;
- último checkpoint;
- y procedimiento de reactivación.

Las integraciones estarán deshabilitadas durante un drill.

---

## 41. Telemetría y auditoría

La telemetría se recuperará según D5.

La auditoría de negocio incluida en PostgreSQL pertenecerá a D1 y no se tratará como log descartable.

La evidencia externa necesaria para investigación tendrá retención y exportación definida según riesgo y obligación.

---

## 42. Destino externo

El destino de backup será almacenamiento de objetos cifrado en una cuenta o proveedor independiente.

Deberá ofrecer:

- cifrado;
- versionado;
- política de retención;
- logs de acceso;
- lifecycle;
- checksums;
- y, cuando sea viable, bloqueo de objetos o inmutabilidad.

La selección comercial queda pendiente.

---

## 43. Región y residencia

La región de cada copia deberá:

- cumplir residencia de datos;
- evitar un fallo común innecesario;
- documentar transferencias internacionales;
- medir latencia y egress;
- y permitir el RTO definido.

No se moverán datos productivos a una región sin aprobación de privacidad y seguridad.

---

## 44. Cifrado

Todos los backups usarán:

- TLS durante transferencia;
- cifrado fuerte en reposo;
- claves administradas y rotables;
- separación entre datos y permisos de claves;
- y prohibición de secretos en nombres de archivo o metadata visible.

La pérdida de una clave no deberá volver irrecuperable toda la historia sin un plan aprobado.

---

## 45. Control de acceso

Se aplicará mínimo privilegio:

| Rol | Permiso |
|---|---|
| Job de backup | Escribir nuevas copias, sin borrar historia cuando sea viable |
| Operación | Consultar estado y ejecutar restauración autorizada |
| Seguridad | Revisar accesos, claves y eventos |
| Datos | Validar integridad y reconciliación |
| Desarrollo ordinario | Sin acceso a backups productivos |

MFA será obligatorio para administración humana.

---

## 46. Inmutabilidad

Las copias críticas usarán retención inmutable o controles equivalentes para resistir:

- ransomware;
- credencial comprometida;
- borrado accidental;
- job defectuoso;
- y acción maliciosa.

El periodo inmutable deberá coexistir con obligaciones válidas de eliminación y privacidad.

---

## 47. Convención y metadata

Cada backup registrará:

- sistema y entorno;
- clase de datos;
- timestamp UTC;
- versión de esquema o commit;
- herramienta y versión;
- cifrado y key ID no secreto;
- checksum;
- tamaño;
- estado;
- retención;
- y job responsable.

---

## 48. Retención inicial

Se propone la siguiente retención para copias externas:

| Copia | Frecuencia | Retención inicial |
|---|---|---|
| PITR D1 | Continua según proveedor | 7 días |
| Lógica D1 | Diaria | 35 días |
| Consolidado D1 | Semanal | 13 semanas |
| Archivo D1 | Mensual | 12 meses |
| Objetos D2 | Diaria/incremental | 35 días de versiones recuperables |
| Evidencia de drills | Trimestral | 24 meses |

Los valores son provisionales y requieren validación legal, financiera y de volumen.

---

## 49. Expiración y borrado

El lifecycle eliminará copias vencidas de forma automática y auditable.

Una excepción requerirá:

- motivo;
- alcance;
- propietario;
- fecha de expiración;
- autorización;
- y revisión de privacidad.

No se acumularán backups indefinidamente por omisión.

---

## 50. Legal hold y privacidad

Una retención legal suspendrá el borrado solo para el alcance autorizado.

La eliminación de una persona o tenant deberá considerar:

- retención legal;
- backups inmutables;
- expiración natural;
- bloqueo de restauración no autorizada;
- y reejecución del borrado después de recuperar una copia antigua.

---

## 51. Automatización

Los jobs se ejecutarán con identidad de máquina independiente y producirán resultado estructurado.

Cada job deberá ser:

- idempotente;
- reintentable;
- observable;
- limitado en tiempo;
- seguro ante ejecución concurrente;
- y capaz de dejar una copia incompleta marcada como inválida.

---

## 52. Validación automática

Después de cada copia se verificará:

- salida no vacía;
- formato legible;
- checksum;
- cifrado;
- manifiesto;
- conteos esperados;
- retención aplicada;
- y presencia en el destino independiente.

Estas verificaciones no sustituyen un restore drill.

---

## 53. Monitoreo y alertas

Se alertará por:

- job fallido;
- copia atrasada;
- último punto recuperable fuera de RPO;
- checksum inválido;
- retención ausente;
- crecimiento anómalo;
- credencial próxima a expirar;
- objeto no copiado;
- y restore fallido.

Las alertas tendrán owner, severidad y ruta de escalamiento.

---

## 54. Backup válido

Una copia contará como válida solo cuando:

- termine sin error;
- tenga alcance conocido;
- sea legible y descifrable;
- esté fuera del fallo cubierto;
- conserve integridad;
- tenga retención verificable;
- y haya participado satisfactoriamente en un drill dentro del periodo definido.

El dashboard verde del proveedor no es evidencia suficiente por sí solo.

---

## 55. Tipos de restauración

El runbook cubrirá:

1. restauración PITR por corrupción o error reciente;
2. recuperación completa a un proyecto nuevo;
3. recuperación desde dump externo;
4. recuperación de objetos;
5. recuperación selectiva por tenant;
6. reconstrucción de código y configuración;
7. y rebuild de datos derivados.

---

## 56. Restauración en aislamiento

La primera restauración ocurrirá en un proyecto o entorno aislado siempre que sea posible.

El entorno:

- no tendrá tráfico público;
- usará secretos rotados o sandbox;
- bloqueará correo, pagos y webhooks;
- limitará acceso humano;
- registrará acciones;
- y se eliminará de forma gobernada al terminar.

---

## 57. Secuencia de recuperación

La secuencia inicial será:

1. detectar y declarar incidente;
2. contener escrituras o efectos dañinos;
3. clasificar alcance y tenants;
4. elegir punto recuperable;
5. aprovisionar entorno aislado;
6. restaurar D1;
7. reconfigurar servicios;
8. restaurar y reconciliar D2;
9. reconstruir D3/D4;
10. validar seguridad e integridad;
11. ejecutar smoke tests;
12. reconciliar transacciones ausentes;
13. aprobar cutover;
14. reabrir tráfico gradualmente;
15. y conservar evidencia.

---

## 58. Autoridad de restauración

Ninguna persona ejecutará por sí sola una restauración destructiva de Production salvo una emergencia break-glass documentada.

Se requiere:

- Operación como ejecutor;
- Datos como validador de integridad;
- Seguridad para accesos y rotación;
- Product Owner para impacto de negocio;
- y registro de la decisión.

---

## 59. Selección del punto

El punto objetivo se elegirá usando:

- inicio conocido del incidente;
- último estado íntegro;
- eventos de auditoría;
- checkpoints de integraciones;
- último backup disponible;
- y costo de perder o repetir transacciones.

Siempre se documentará por qué se eligió ese punto.

---

## 60. Ventana de escritura y cutover

Antes del cutover se definirá si:

- Production queda en mantenimiento;
- se bloquean escrituras;
- se encolan comandos;
- se aplica una delta;
- o se acepta una ventana de pérdida dentro de RPO.

Reabrir sin reconciliación puede duplicar pagos, inventario o eventos.

---

## 61. Integridad de base

La validación incluirá:

- migraciones esperadas;
- constraints;
- claves foráneas;
- conteos y totales de control;
- funciones y triggers;
- extensiones;
- auditoría;
- outbox/inbox;
- jobs;
- y capacidad de lectura/escritura controlada.

---

## 62. Aislamiento multi-tenant

Todo drill verificará al menos:

- tenant A puede acceder a A;
- tenant A no puede acceder a B;
- RLS está activa;
- claves compuestas preservan tenant;
- Storage respeta paths y políticas;
- cachés y jobs incluyen scope;
- y no existen objetos huérfanos cruzados.

Cero cruces de tenant es el criterio aceptable.

---

## 63. Recuperación de un tenant

Una recuperación selectiva no restaurará directamente el backup compartido sobre Production.

El proceso será:

1. restaurar la copia completa en aislamiento;
2. identificar todas las filas y objetos del tenant;
3. validar dependencias globales y compartidas;
4. exportar un paquete autorizado;
5. ensayar la importación;
6. aplicar idempotencia y reconciliación;
7. importar con transacción o compensación;
8. verificar que otros tenants no cambiaron;
9. y registrar auditoría.

---

## 64. Límites de recuperación por tenant

La recuperación selectiva puede ser imposible o riesgosa cuando existan:

- secuencias globales;
- agregados compartidos;
- referencias cross-tenant autorizadas;
- eventos ya enviados;
- objetos sin scope;
- o integraciones externas irreversibles.

En esos casos se preferirá reconciliación de negocio sobre sustitución física de filas.

---

## 65. Restauración de Storage

La restauración de objetos verificará:

- bucket y ruta;
- contenido y checksum;
- metadata;
- políticas;
- vínculo con registros;
- tenant;
- disponibilidad desde la aplicación;
- y objetos eliminados después del punto elegido.

No se considerará completada con archivos inaccesibles o referencias rotas.

---

## 66. Efectos externos

Antes de habilitar integraciones se revisará:

- outbox pendiente;
- webhooks ya entregados;
- correos y SMS;
- cobros;
- inventario;
- folios;
- y jobs programados.

La restauración no debe repetir silenciosamente efectos irreversibles.

---

## 67. Smoke tests

Los smoke tests de recuperación cubrirán como mínimo:

- autenticación;
- selección de tenant;
- autorización;
- lectura y escritura crítica;
- carga y descarga de Storage;
- Edge Functions necesarias;
- flujo transaccional principal;
- auditoría;
- y observabilidad.

Las integraciones reales permanecerán en modo seguro hasta aprobación.

---

## 68. Medición de RPO

Cada drill registrará:

- timestamp del último dato íntegro conocido;
- timestamp del punto restaurado;
- diferencia observada;
- transacciones perdidas;
- transacciones repetibles;
- y reconciliación necesaria.

El valor máximo observado se comparará con el objetivo de su clase.

---

## 69. Medición de RTO

El reloj incluirá:

1. detección;
2. declaración;
3. acceso y autorización;
4. provisión;
5. restauración;
6. configuración;
7. integridad;
8. smoke tests;
9. cutover;
10. y reapertura segura.

No terminará al finalizar `pg_restore`.

---

## 70. Simulacros

Frecuencia inicial propuesta:

| Ejercicio | Frecuencia |
|---|---|
| Validación automática de copias | Cada ejecución |
| Restore lógico automatizado de muestra | Mensual |
| Restore completo D1 + D2 | Trimestral |
| Recuperación por tenant | Semestral |
| Recuperación de repositorio | Semestral |
| Tabletop de desastre | Semestral |
| Drill extraordinario | Después de un cambio material o incidente |

---

## 71. Evidencia de drill

Cada simulacro conservará:

- escenario;
- participantes;
- autorizaciones;
- timestamps;
- backup elegido;
- RPO/RTO observado;
- checks ejecutados;
- diferencias;
- datos o tenants afectados;
- fallas del runbook;
- acciones correctivas;
- y aprobación de cierre.

---

## 72. Staging para simulacros

Staging podrá participar en pruebas funcionales, pero una restauración productiva no se mezclará con su uso ordinario.

Se preferirá un proyecto temporal aislado para:

- evitar contaminación;
- deshabilitar integraciones;
- aplicar acceso especial;
- medir desde cero;
- y destruir los datos restaurados al finalizar.

---

## 73. Integración con CI/CD

GitHub Actions podrá:

- programar copias lógicas;
- validar manifiestos;
- ejecutar restores de prueba;
- publicar métricas;
- y abrir incidentes o issues.

Los workflows de forks o Pull Requests no recibirán credenciales productivas. Production usará GitHub Environment y aprobación cuando corresponda.

---

## 74. Costos

Se presupuestará:

- PITR y compute requerido;
- almacenamiento externo;
- versionado e inmutabilidad;
- egress;
- proyectos temporales de restore;
- ejecución de jobs;
- observabilidad;
- y horas de simulacro.

Reducir costo no autoriza declarar un RPO que la capacidad no puede cumplir.

---

## 75. Consecuencias positivas

- recuperación alineada con clases de datos;
- defensa frente a errores recientes y fallos catastróficos;
- Storage protegido explícitamente;
- menor dependencia de una única cuenta;
- recuperación por tenant gobernada;
- configuración reconstruible;
- y RPO/RTO medibles.

---

## 76. Consecuencias negativas

- costo recurrente;
- mayor superficie operativa;
- necesidad de claves y credenciales adicionales;
- drills que consumen tiempo y recursos;
- complejidad de reconciliar base y objetos;
- y responsabilidad de mantener runbooks vigentes.

---

## 77. Riesgos y controles

| Riesgo | Control |
|---|---|
| PITR no contratado | Gate de aceptación y alerta de capacidad |
| Copia externa corrupta | Checksums y restore mensual |
| Storage incompleto | Manifiesto y reconciliación |
| Credencial comprometida | Cuenta separada, MFA, mínimo privilegio e inmutabilidad |
| Restore envía efectos reales | Integraciones deshabilitadas y credenciales sandbox |
| Cruce de tenant | Pruebas RLS y comparación antes/después |
| Retención excesiva | Lifecycle, revisión legal y purga |
| Clave de cifrado perdida | Custodia y recuperación de claves probada |
| Runbook obsoleto | Drill periódico y revisión por cambio material |

---

## 78. Plan de implementación

### Fase 1 — inventario

- clasificar datos y buckets;
- medir volumen y tasa de cambio;
- inventariar configuración y secretos;
- confirmar plan Supabase;
- y asignar owners.

### Fase 2 — protección

- habilitar PITR;
- crear destino independiente;
- automatizar dump lógico;
- copiar Storage;
- aplicar cifrado, lifecycle e inmutabilidad;
- y configurar alertas.

### Fase 3 — recuperación

- escribir runbooks;
- automatizar restore de prueba;
- definir paquete por tenant;
- y ejecutar simulacro completo.

### Fase 4 — aceptación

- medir RPO/RTO;
- corregir brechas;
- aprobar costo y seguridad;
- y cambiar estado del ADR.

---

## 79. Piloto mínimo

El piloto usará datos sintéticos e incluirá:

- base con Auth, RLS y outbox;
- al menos dos tenants;
- objetos de Storage por tenant;
- PITR o backup físico disponible;
- dump lógico externo;
- restauración a proyecto aislado;
- recuperación selectiva de un tenant;
- y medición completa.

---

## 80. Criterios de aceptación

Este ADR podrá pasar a Aceptado cuando:

- PITR demuestre RPO D1;
- la copia externa esté fuera del dominio primario;
- Storage tenga backup y manifiesto verificables;
- Git sea recuperable sin una sola cuenta personal;
- configuración y secretos tengan inventario/runbook;
- un restore completo cumpla o mida RTO;
- las pruebas multi-tenant no detecten cruces;
- alertas y owners estén activos;
- retención y costo estén aprobados;
- y la evidencia del drill sea revisada.

---

## 81. Preguntas abiertas

- ¿qué proveedor y cuenta alojarán las copias externas?;
- ¿qué región satisface residencia y RTO?;
- ¿se aprueba PITR de 7 días?;
- ¿qué buckets contienen objetos irremplazables?;
- ¿35/13/12 satisface obligaciones fiscales y contractuales?;
- ¿qué herramienta copiará Storage con checksums?;
- ¿cómo se custodiarán claves de cifrado?;
- ¿qué datos de GitHub fuera de Git deben respaldarse?;
- ¿qué tablas globales participan en una recuperación por tenant?;
- y ¿quién autoriza un cutover fuera de horario?

---

## 82. Métricas

Se observarán:

- porcentaje de jobs exitosos;
- antigüedad de la última copia válida;
- punto PITR más reciente;
- bytes y objetos protegidos;
- diferencias del manifiesto;
- tiempo de restore;
- RPO/RTO observado;
- porcentaje de drills exitosos;
- hallazgos abiertos;
- costo mensual;
- y tiempo hasta corregir una falla de backup.

---

## 83. Disparadores de revisión

El ADR se revisará cuando:

- cambie el proveedor o plan;
- cambien RPO/RTO;
- aumente materialmente el volumen;
- aparezca una obligación de residencia o retención;
- se agregue información altamente sensible;
- cambie el modelo multi-tenant;
- un drill falle;
- un incidente exceda objetivos;
- o una nueva capacidad reduzca riesgo o costo.

---

## 84. Aprobaciones requeridas

| Área | Estado | Motivo |
|---|---|---|
| Producto | Pendiente | Impacto y objetivos internos |
| Arquitectura | Pendiente | Coherencia de solución |
| Datos | Pendiente | Integridad y restauración |
| Seguridad | Pendiente | Acceso, cifrado y privacidad |
| Operación | Pendiente | Jobs, alertas y runbooks |
| Finanzas | Pendiente | PITR, almacenamiento y egress |

---

## 85. Historial

| Fecha | Cambio |
|---|---|
| 2026-07-12 | Propuesta inicial de estrategia multicapa |

---

## 86. Referencias internas

- [Arquitectura de datos](../data-architecture.md)
- [Arquitectura de deployment](../deployment-architecture.md)
- [Arquitectura multi-tenant](../multi-tenancy-architecture.md)
- [ADR-0001: aislamiento de tenant](0001-tenant-isolation-model.md)
- [ADR-0002: baseline y migraciones](0002-schema-baseline-and-migrations.md)
- [ADR-0007: CI/CD](0007-ci-cd-pipeline.md)
- [ADR-0009: objetivos de servicio y recuperación](0009-service-level-and-recovery-objectives.md)
- [ADR-0014: separación de entornos Supabase](0014-supabase-environment-isolation.md)

---

## 87. Referencias externas

- [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase — Restore to a new project](https://supabase.com/docs/guides/platform/clone-project)
- [Supabase CLI — `db dump`](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Supabase Storage — S3 Compatibility](https://supabase.com/docs/guides/storage/s3/compatibility)
- [GitHub — Backing up a repository](https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository)

---

## 88. Resultado esperado

Cuando esta decisión esté implementada, CRUMAFOOD podrá responder con evidencia:

- qué se protege;
- cada cuánto;
- dónde;
- por cuánto tiempo;
- quién puede recuperarlo;
- cuánto dato podría perderse;
- cuánto tarda volver a operar;
- cómo se recupera un tenant sin afectar a otros;
- y cuándo fue la última restauración exitosa.

---

## 89. Declaración final

> **CRUMAFOOD no considerará protegido un dato por el solo hecho de existir una copia. La recuperación será una capacidad multicapa, aislada, medible y ensayada: PITR para el tiempo, copias externas para el dominio de fallo, Storage como objeto independiente y restauración verificada para demostrar el resultado.**
