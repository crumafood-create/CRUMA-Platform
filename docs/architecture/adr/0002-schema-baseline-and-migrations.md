# ADR-0002: Establecer baseline y migraciones canónicas de PostgreSQL/Supabase

> **Propuesta:** convertir `supabase/migrations/` en la fuente versionada de evolución del esquema, partiendo de un baseline revisado del estado realmente desplegado.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-07-12 |
| Decisores | Product Owner, responsable de arquitectura, responsable de datos y responsable de operación |
| Consultados | Seguridad, responsables de módulos, calidad e Identity & Access |
| Informados | Desarrollo, soporte y responsables de clientes e integraciones |
| Propietario | Responsable de datos con corresponsabilidad de arquitectura |
| Alcance | PostgreSQL, Supabase, migraciones, RLS, funciones, triggers, tipos, seeds, CI, despliegue, drift y recuperación |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; spike seguro ejecutado del 2026-08-01 al 2026-08-02, con extracción y reconstrucción completadas; aceptación todavía condicionada a seguridad, CI y reconciliación |
| Issues relacionados | Pendiente: inventario remoto completo, pruebas de seguridad, seeds, CI de migraciones, reconciliación del historial y verificación de drift |

---

## 1. Resumen ejecutivo

PostgreSQL/Supabase es la autoridad transaccional de CRUMAFOOD, pero el repositorio no contiene hoy un historial SQL verificable capaz de reconstruir el esquema desplegado.

Parte del esquema se creó o modificó de forma ad hoc. La documentación conceptual no permite demostrar tablas, columnas, constraints, funciones, triggers, índices o policies vigentes.

La decisión propuesta es:

> **CRUMAFOOD usa `supabase/migrations/` como ubicación canónica e inmutable de toda evolución de PostgreSQL/Supabase; crea un baseline revisado desde el esquema desplegado; separa seeds de migraciones; y verifica reconstrucción, RLS, funciones y ausencia de drift mediante Supabase CLI y CI.**

---

## 2. Contexto

La plataforma depende de:

- PostgreSQL;
- Supabase Auth;
- RLS;
- funciones RPC;
- Storage;
- Realtime;
- y relaciones de negocio.

Los documentos de datos, seguridad y despliegue exigen migraciones versionadas.

Al iniciar el spike, el repositorio no contenía:

- `supabase/config.toml`;
- `supabase/migrations/`;
- un baseline SQL;
- un seed canónico;
- ni CI que reconstruya la base.

El spike ejecutado entre el 2026-08-01 y el 2026-08-02 añade configuración local mínima, un inventario reproducible de referencias Supabase encontradas en el código y un baseline SQL derivado mediante acceso autorizado y de solo lectura al esquema desplegado. El baseline fue reconstruido desde cero y validado localmente. Permanecen pendientes las pruebas específicas de seguridad, los seeds, la automatización en CI y la reconciliación segura del historial remoto.

---

## 3. Problema

Sin baseline e historial canónico no puede demostrarse:

- qué esquema existe;
- cómo crear un entorno nuevo;
- si RLS está completa;
- si una función tiene la versión esperada;
- si Production y Preview divergen;
- cómo revisar un cambio;
- ni cómo ejecutar ADR-0001 con seguridad.

Los cambios manuales pueden crear una realidad no representada en Git.

---

## 4. Alcance

Esta decisión cubre:

- ubicación canónica;
- baseline inicial;
- convención de migraciones;
- inmutabilidad;
- forward compatibility;
- RLS;
- funciones;
- triggers;
- índices;
- extensiones;
- seeds;
- tipos generados;
- Supabase local;
- CI;
- promoción;
- drift;
- rollback;
- y recuperación.

No decide:

- ORM;
- proveedor alternativo;
- estrategia de backups;
- RPO/RTO final;
- ni modelo físico de cada dominio.

---

## 5. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Reproducibilidad | Crítica | Una base vacía debe alcanzar el estado esperado |
| Integridad | Crítica | Constraints y transacciones deben versionarse |
| Seguridad | Crítica | RLS, grants y funciones son parte del esquema |
| Trazabilidad | Alta | Cada cambio debe relacionarse con código y decisión |
| Compatibilidad | Alta | Código y esquema coexistirán durante despliegues |
| Recuperación | Alta | Debe conocerse el estado al restaurar |
| Revisión | Alta | SQL debe pasar Pull Request |
| Operabilidad | Alta | Local, CI y entornos deben usar el mismo proceso |
| Simplicidad | Alta | No se añadirá un ORM solo para migraciones |
| Portabilidad | Media | SQL PostgreSQL debe permanecer visible |

---

## 6. Restricciones

La decisión deberá respetar:

- PostgreSQL/Supabase como autoridad;
- esquema desplegado aún no reconciliado;
- RLS y service role;
- Vercel como runtime de aplicación;
- datos existentes;
- entornos separados;
- migraciones compatibles;
- y ADR-0001 todavía Propuesto.

No se podrá asumir que `database-map.md` representa el esquema real.

---

## 7. Supuestos

La propuesta asume que:

- existe acceso autorizado para inspeccionar el proyecto Supabase;
- el esquema puede exportarse sin exponer datos;
- el equipo puede ejecutar Supabase local;
- PostgreSQL es suficiente para las capacidades actuales;
- y los cambios manuales pueden congelarse durante la reconciliación.

Estos supuestos deberán validarse antes de Aceptado.

---

## 8. Criterios de decisión

| Criterio | Prioridad | Evaluación |
|---|---|---|
| Reconstrucción desde cero | Crítica | Reset local y CI |
| Fidelidad al desplegado | Crítica | Diff e inventario autorizado |
| Seguridad versionada | Crítica | Policies, grants y funciones |
| Revisión | Alta | SQL legible en Pull Request |
| Compatibilidad Supabase | Alta | CLI, Auth, Storage y Realtime |
| Drift | Alta | Comparación automática o controlada |
| Operación | Alta | Flujo local, Preview y Production |
| Salida | Media | SQL PostgreSQL portable |

---

## 9. Opciones consideradas

| Opción | Resumen | Resultado propuesto |
|---|---|---|
| A | Supabase CLI y `supabase/migrations/` | Elegida |
| B | Migraciones SQL en `database/migrations/` con tooling propio | No elegida |
| C | Adoptar ORM y su sistema de migraciones | No elegida ahora |
| D | Mantener cambios desde Dashboard/SQL Editor | Rechazada |

---

## 10. Opción A — Supabase CLI y ruta canónica

### Descripción

El repositorio incorpora configuración Supabase, migraciones timestamped y seed separado.

Supabase CLI levanta un entorno local y aplica el historial.

### Ventajas

- alineación con el proveedor actual;
- soporte de PostgreSQL, Auth, Storage y RLS;
- SQL visible;
- workflow local;
- diff y tipos;
- y menor tooling propio.

### Desventajas

- dependencia operacional del CLI;
- diferencias posibles entre local y hosted;
- baseline inicial delicado;
- y necesidad de fijar versiones.

### Riesgos

- generar SQL ruidoso;
- aplicar baseline sobre Production existente;
- o reconciliar incorrectamente el historial remoto.

### Resultado

Se elige, condicionado a spike de extracción, reset y reconciliación.

---

## 11. Opción B — Carpeta SQL y tooling propio

### Descripción

El repositorio usa `database/migrations/` y scripts propios para aplicar SQL.

### Ventajas

- menor acoplamiento nominal al layout Supabase;
- control total;
- y SQL directo.

### Desventajas

- hay que construir tracking, reset, diff, secrets y CI;
- integración inferior con Supabase local;
- más mantenimiento;
- y mayor riesgo operacional.

### Resultado

No se elige porque reproduce capacidades necesarias sin beneficio actual suficiente.

---

## 12. Opción C — ORM como autoridad de migraciones

### Descripción

Prisma, Drizzle u otro ORM define el schema y genera migraciones.

### Ventajas

- tipos y tooling;
- ergonomía en ciertas consultas;
- y abstracción.

### Desventajas

- tecnología no adoptada;
- RLS, policies, grants, triggers y funciones siguen requiriendo SQL;
- puede ocultar capacidades PostgreSQL;
- y agrega una decisión mayor no justificada.

### Resultado

No se elige en esta etapa.

---

## 13. Opción D — Dashboard y SQL manual

### Descripción

Los cambios se realizan directamente en Supabase y se documentan después.

### Ventajas

- velocidad aparente para cambios pequeños.

### Desventajas

- ausencia de revisión;
- deriva;
- ambientes irreproducibles;
- rollback incierto;
- seguridad no versionada;
- y dependencia de memoria.

### Resultado

Se rechaza como proceso permanente.

---

## 14. Decisión propuesta

Se propone:

> **CRUMAFOOD versiona toda evolución de PostgreSQL/Supabase en `supabase/migrations/`, usa Supabase CLI como workflow local y de CI, crea un baseline desde el esquema desplegado y trata migraciones aplicadas como artefactos inmutables.**

La decisión incluye:

- `supabase/config.toml`;
- `supabase/migrations/<timestamp>_<description>.sql`;
- `supabase/seed.sql` o seeds separados aprobados;
- versión fijada del CLI;
- baseline revisado;
- historial reconciliado;
- RLS, grants, funciones, triggers e índices en SQL;
- generación de tipos derivada;
- CI con reset;
- detección de drift;
- y promoción controlada.

---

## 15. Estructura canónica

```text
supabase/
├── config.toml
├── migrations/
│   ├── <timestamp>_baseline.sql
│   ├── <timestamp>_<change>.sql
│   └── ...
├── seed.sql
└── tests/
    ├── rls/
    ├── functions/
    └── data/
```

La estructura podrá ampliarse sin cambiar la autoridad de `migrations/`.

---

## 16. Baseline

El baseline representa el punto de partida reproducible del esquema desplegado.

Incluirá, según corresponda:

- schemas;
- extensiones;
- tipos;
- secuencias;
- tablas;
- constraints;
- índices;
- vistas;
- funciones;
- triggers;
- grants;
- RLS;
- policies;
- y configuración SQL necesaria.

No incluirá datos de clientes.

---

## 17. Fuente del baseline

El baseline se obtendrá mediante:

1. introspección autorizada del esquema real;
2. exportación de definiciones, no datos;
3. inventario independiente;
4. comparación con documentación y código;
5. limpieza de elementos administrados;
6. revisión manual;
7. reconstrucción local;
8. y comparación final.

No se escribirá desde memoria ni desde `database-map.md`.

---

## 18. Inventario obligatorio

Antes de generar baseline se inventariarán:

- versiones PostgreSQL y extensiones;
- schemas;
- tablas y columnas;
- PK y FK;
- unique y checks;
- índices;
- views;
- materialized views;
- funciones;
- triggers;
- RLS;
- policies;
- grants;
- Storage buckets y policies relacionadas;
- publicaciones Realtime;
- y objetos administrados por Supabase.

---

## 19. Objetos administrados

Los schemas y objetos administrados por Supabase se tratarán según documentación y comportamiento del CLI.

No se copiarán indiscriminadamente:

- secretos;
- roles internos;
- metadatos del proveedor;
- datos Auth;
- ni objetos que el entorno local crea por sí mismo.

El spike documentará exclusiones.

---

## 20. Historial remoto

Production ya contiene un estado que no debe recrearse aplicando ciegamente el baseline.

La reconciliación deberá:

- identificar historial registrado;
- comparar estado;
- establecer el baseline como aplicado mediante procedimiento aprobado;
- probar en un entorno clonado o representativo;
- y conservar evidencia.

No se improvisarán comandos en Production.

---

## 21. Convención de migraciones

Los archivos usarán:

```text
<timestamp>_<descripcion_en_kebab_o_snake_case>.sql
```

La convención concreta de separador seguirá la salida compatible del CLI.

El nombre describirá intención:

- `add_tenant_memberships`;
- `enforce_inventory_tenant_scope`;
- `add_sales_order_idempotency`.

No se usarán nombres como `fix.sql` o `final.sql`.

---

## 22. Inmutabilidad

Una migración aplicada en un entorno compartido:

- no se reescribe;
- no se renombra;
- no se reordena;
- y no se elimina.

Una corrección se expresa en una migración posterior.

Las migraciones aún no compartidas podrán ajustarse antes de merge.

---

## 23. Forward compatibility

Los cambios seguirán expand–migrate–contract:

1. añadir estructura compatible;
2. desplegar código que entiende ambos estados;
3. migrar datos;
4. verificar;
5. retirar uso anterior;
6. eliminar estructura en entrega posterior.

No se renombrará o eliminará una columna usada por una versión desplegada en el mismo paso.

---

## 24. Transacciones

Cada migración evaluará si puede ejecutarse dentro de transacción.

Se considerarán:

- locks;
- duración;
- índices concurrentes;
- volumen;
- timeouts;
- y capacidades no transaccionales.

Una migración larga se dividirá y tendrá runbook.

---

## 25. RLS y grants

RLS forma parte del esquema versionado.

Toda migración de seguridad incluirá:

- habilitación;
- force cuando aplique;
- policies;
- grants;
- revoke;
- funciones auxiliares;
- comentarios;
- y pruebas.

No se habilitará RLS sin policies previstas para el rollout.

---

## 26. Funciones y triggers

Las funciones PostgreSQL:

- vivirán en migraciones;
- fijarán tipos;
- declararán volatility apropiada;
- controlarán `search_path`;
- tendrán owner y grants;
- serán probadas;
- y se reemplazarán mediante migración posterior.

Los triggers tendrán propósito, owner y pruebas.

---

## 27. Índices y constraints

Los índices y constraints se crearán junto con el cambio que los necesita.

Cada índice tendrá:

- consulta o restricción;
- estimación de costo;
- estrategia de build;
- y verificación.

Las constraints nuevas sobre datos existentes requerirán limpieza previa o validación por fases.

---

## 28. Seeds

Los seeds estarán separados de migraciones.

Se distinguirán:

- catálogos obligatorios;
- datos de desarrollo;
- fixtures de prueba;
- y escenarios de demostración.

Los seeds serán:

- sintéticos;
- idempotentes o reiniciables;
- mínimos;
- y no sensibles.

Production no recibirá datos demo.

---

## 29. Datos de referencia

Un catálogo requerido por la aplicación podrá:

- insertarse mediante seed gobernado;
- o migrarse como dato de referencia versionado

según si forma parte del contrato del esquema.

La elección se documentará.

Datos mutables del negocio no vivirán en migraciones.

---

## 30. Tipos generados

Los tipos TypeScript derivados del esquema:

- se generarán desde el estado canónico;
- tendrán comando reproducible;
- se revisarán;
- y no serán autoridad sobre PostgreSQL.

CI podrá verificar que no estén desactualizados.

No se editarán manualmente.

---

## 31. Workflow local

El flujo objetivo será:

1. instalar versión fijada de Supabase CLI;
2. iniciar servicios locales;
3. resetear desde migraciones;
4. aplicar seeds apropiados;
5. generar tipos;
6. ejecutar pruebas;
7. crear migración nueva;
8. repetir reset;
9. y abrir Pull Request.

El comando exacto se documentará después del spike.

---

## 32. CI

CI deberá:

- levantar entorno aislado;
- aplicar todas las migraciones desde cero;
- aplicar seed de prueba;
- ejecutar pruebas de constraints;
- ejecutar RLS positiva y negativa;
- probar funciones;
- generar o verificar tipos;
- ejecutar integración;
- y conservar logs seguros.

Un build de Next.js no sustituye esta verificación.

---

## 33. Entornos

Development, Preview y Production tendrán:

- proyectos separados cuando se apruebe ADR correspondiente;
- historial consistente;
- credenciales separadas;
- y promoción controlada.

No se probará una migración por primera vez en Production.

El estado de cada entorno será observable.

---

## 34. Promoción

La secuencia será:

1. revisión SQL;
2. reset local;
3. CI;
4. entorno no productivo;
5. smoke e integración;
6. respaldo o punto de recuperación;
7. Production;
8. verificación;
9. y monitoreo.

El código y esquema se coordinarán según compatibilidad.

---

## 35. Drift

Drift es cualquier diferencia no explicada entre:

- historial versionado;
- esquema esperado;
- y esquema desplegado.

Se detectará mediante introspección o diff en un flujo controlado.

Un drift no se “arreglará” sobrescribiendo Git sin investigar su origen.

---

## 36. Cambios manuales

Los cambios manuales permanentes en Dashboard o SQL Editor están prohibidos como proceso normal.

Una emergencia deberá:

- tener aprobación;
- registrar SQL;
- limitar alcance;
- crear migración equivalente inmediatamente;
- reconciliar historial;
- y revisar causa.

La emergencia no crea una segunda fuente de verdad.

---

## 37. Rollback y roll-forward

Se preferirá roll-forward porque:

- el código puede haber escrito datos con el nuevo esquema;
- un down migration puede destruir información;
- y varios entornos pueden estar en estados distintos.

Cada cambio tendrá:

- contención;
- compatibilidad;
- backup;
- verificación;
- y estrategia de corrección.

Un down migration se usará solo cuando sea seguro y probado.

---

## 38. Despliegues fallidos

Ante una migración fallida:

- se detendrá promoción;
- se preservarán logs;
- se determinará atomicidad;
- se verificará estado real;
- se bloquearán versiones incompatibles;
- y se ejecutará el runbook.

No se volverá a ejecutar ciegamente una migración parcialmente aplicada.

---

## 39. Consecuencias positivas

- esquema reproducible;
- seguridad revisable;
- entornos consistentes;
- cambios trazables;
- tipos derivados;
- integración en CI;
- base para ADR-0001;
- recuperación más confiable;
- y reducción de cambios ad hoc.

---

## 40. Consecuencias negativas

- esfuerzo inicial de inventario;
- riesgo en reconciliación;
- disciplina de migraciones;
- tiempo adicional en CI;
- necesidad de operar Supabase local;
- y posible ruido en baseline.

---

## 41. Impacto arquitectónico

| Área | Impacto |
|---|---|
| Business Core | Adaptadores dependen de contratos reproducibles |
| Datos | Nueva autoridad versionada de evolución |
| Seguridad | RLS, grants y funciones revisables |
| Integraciones | Contratos de datos coordinados |
| Despliegue | Migración antes o junto con código compatible |
| Observabilidad | Estado, duración, error y versión de migración |
| Pruebas | Base efímera desde cero |
| Multi-tenancy | Dependencia para propagar `tenant_id` |
| Recuperación | Baseline e historial respaldan restauración |

---

## 42. Seguridad

Los artefactos no incluirán:

- passwords;
- tokens;
- connection strings;
- datos Auth;
- secretos de funciones;
- ni datos productivos.

Las migraciones revisarán:

- owners;
- grants;
- RLS;
- `search_path`;
- SECURITY DEFINER;
- y acceso público.

---

## 43. Observabilidad

Cada ejecución registrará:

- entorno;
- versión;
- migration ID;
- inicio;
- fin;
- duración;
- resultado;
- error seguro;
- y correlación con release.

Se alertará por:

- fallo;
- drift;
- duración anómala;
- y entorno atrasado.

---

## 44. Validación previa a Aceptado

### Evidencia del spike — 2026-08-01 al 2026-08-02

| Evidencia | Resultado | Conformidad |
|---|---|---|
| Supabase CLI | `2.109.1` fijado en manifest y lockfile | Conforme |
| Configuración local | `supabase/config.toml` mínimo y sin secretos | Conforme |
| Inventario de aplicación | Ejecución reproducible identificó 49 relaciones, 2 RPC y 0 buckets literales referenciados en `src` | Conforme como evidencia auxiliar; no sustituye el inventario completo del esquema |
| Acceso al esquema alojado | Extracción autorizada y de solo lectura del schema `public` de Production mediante Session pooler, sin vincular el proyecto y sin ejecutar escrituras | Conforme |
| Exportación del esquema | Dump de definiciones sin datos: 7,472 líneas, 238,947 bytes y SHA-256 `b6917628a6fd176050a5871f2b18bc65569686f6a6dc8253a6928060d2154674` | Conforme |
| Exclusión de datos | No se detectaron instrucciones `COPY` ni `INSERT INTO` | Conforme |
| Revisión de secretos | No se detectaron claves privadas, AWS access keys, Supabase secret keys ni JWT literales | Conforme como control inicial; permanece sujeta a secret scanning del PR |
| Extensiones requeridas | `pgvector` se crea en `public` para reproducir la ubicación vigente en Production | Conforme para paridad; su traslado futuro a `extensions` requerirá una migración independiente |
| Baseline versionado | `20260802000000_schema_baseline.sql`, normalizado a 7,465 líneas y SHA-256 `ce6621f8a27297de85745bf4982a3f1c8c1187dc7c91dfc9362de88a015f6dc5` | Conforme |
| Reconstrucción desde cero | Las migraciones se aplicaron sobre una base local vacía mediante Supabase CLI | Conforme |
| Objetos reconstruidos | 124 tablas, 12 vistas, 188 policies y RLS habilitado en las 124 tablas de `public` | Conforme respecto del baseline exportado |
| Funciones exportadas | 11 funciones incluidas en el baseline | Conforme para presencia; sus contratos y permisos requieren pruebas específicas |
| Funciones `SECURITY DEFINER` | `handle_new_user()` e `is_admin(uuid)` ejecutan con privilegios del propietario sin fijar un `search_path` seguro | No conforme; deberán endurecerse mediante una migración posterior antes de aceptar ADR-0002 |
| Grants de funciones | Las 11 funciones exportadas conceden ejecución a `anon`, `authenticated` y `service_role`, incluidas funciones de mutación y funciones de trigger | Pendiente de revisión de mínimo privilegio; el baseline conserva fielmente el estado observado en Production |
| Columnas vectoriales | `ai_search_queries.embedding` y `product_embeddings.embedding` reproducidas como `public.vector(1536)` | Conforme |
| Lint del esquema | `supabase db lint --local --level error` terminó sin hallazgos | Conforme |
| Tipos derivados | Generación local reproducible: 6,819 líneas y 205,431 bytes | Conforme como prueba de generación; falta definir ubicación canónica y verificación en CI |
| Validación de aplicación | Typecheck, ESLint, pruebas con cobertura y build de Next.js completaron correctamente | Conforme |
| Aislamiento local | Servicios publicados mediante la red `cruma-supabase-local`, restringida a `127.0.0.1` | Conforme |
| Compatibilidad con Codespaces | `vector` y `logflare` se excluyeron por health checks incompatibles; Storage y Studio requirieron tiempo adicional para alcanzar estado saludable | Excepción local documentada |
| Red durante reset | `--network-id cruma-supabase-local` debe repetirse en `db reset`; la generación de tipos requirió una red temporal posteriormente eliminada | Limitación operativa documentada |
| Seeds | No existe todavía un seed canónico | Pendiente |
| Pruebas de seguridad | No se han ejecutado pruebas positivas y negativas de RLS, grants y funciones | Pendiente |
| CI de base de datos | Aún no reconstruye el baseline ni verifica tipos y seguridad | Pendiente |
| Historial remoto | Inventario linked completado; la tabla `supabase_migrations.schema_migrations` no existe y ninguna de las siete versiones figura en Remote | Evidencia capturada; reconciliación pendiente |
| Drift | Diff gobernado de `public` capturado y sanitizado; Production conserva diferencias estructurales y de privilegios respecto de Git | Evidencia capturada; remediación pendiente |

### Evidencia gobernada de Production — 2026-08-18

La captura se realizó durante una ventana autorizada, con operaciones de solo lectura y evidencia temporal fuera del repositorio. El token temporal se revocó al finalizar.

| Control | Resultado | Conformidad |
|---|---|---|
| Inventario de migraciones | `migration list --linked` terminó con código 0; siete versiones Local y ninguna Remote | Conforme como captura; no demuestra alineación |
| Ledger remoto | `to_regclass('supabase_migrations.schema_migrations')` devolvió `NULL` | No conforme; historial remoto no inicializado |
| Comparador determinista | Rechazó el inventario sin versiones remotas con código 1 | Conforme; no asumió historial vacío |
| Drift de `public` | `db diff --linked --schema public` terminó con código 0; 1,600 líneas y 56,630 bytes | Conforme como evidencia de solo lectura |
| Integridad de evidencia | SHA-256 `112eaa0b8899c0f3f489f9d3d7c950688171a8b40085085fc76c3d5b52a7b524` | Conforme |
| Revisión de secretos | Sin URLs con credenciales, tokens, service-role keys, JWT secrets ni placeholders de contraseña | Conforme |
| Resumen estructural | 4 `CREATE`, 11 `ALTER`, 3 `DROP`, 744 `GRANT` y 0 `REVOKE` | Requiere reconciliación |
| Contrato de catálogo | Production no contiene las columnas, constraints y consistencia familia-categoría añadidas el 2026-08-09 | No conforme |
| Privilegios | Persisten 248 grants de `REFERENCES`, 248 de `TRIGGER` y 248 de `TRUNCATE` | No conforme con mínimo privilegio |
| Policies administrativas | `admin_all_products` y `admin_all_user_roles` continúan concedidas a `public` | No conforme |
| Escrituras remotas | No se ejecutaron `migration repair`, `db push`, `migration up` ni SQL de mutación | Conforme |

Clasificación por versión:

| Versión | Estado estructural observado | Tratamiento propuesto |
|---|---|---|
| `20260801000000_required_extensions` | Representada en Production; no registrada en ledger | Candidata a reconciliación individual después de aprobación |
| `20260802000000_schema_baseline` | Representada como estado histórico de Production; no registrada en ledger | Candidata a reconciliación individual después de aprobación |
| `20260804000000_harden_function_execution` | No representada | Aplicar mediante el flujo normal después de controles |
| `20260806000000_harden_table_privileges` | No representada; persisten grants amplios | Aplicar mediante el flujo normal después de controles |
| `20260807000000_scope_admin_rls_policies` | No representada; policies siguen dirigidas a `public` | Aplicar mediante el flujo normal después de controles |
| `20260809000000_reconcile_catalog_schema_contract` | No representada | Aplicar mediante el flujo normal después de controles |
| `20260809010000_enforce_product_family_category_consistency` | No representada | Aplicar mediante el flujo normal después de controles |

Esta evidencia no autoriza escrituras. Nunca se marcarán las siete versiones como aplicadas: únicamente las dos versiones estructuralmente representadas podrán evaluarse para `migration repair --status applied`, una por una y con aprobación explícita. Las cinco versiones restantes deberán desplegarse y verificarse como migraciones reales.

**Resultado del spike:** el esquema real de Production fue extraído de forma autorizada y sin datos, convertido en migraciones versionadas y reconstruido con éxito sobre una base local vacía. El baseline reproduce los objetos principales observados y permite generar tipos TypeScript. No se realizaron escrituras ni se vinculó el CLI con Production.

ADR-0002 permanece **Propuesto** porque la existencia del baseline no completa por sí sola la decisión. Antes de pasar a Aceptado deberán completarse:

- inventario remoto y comparación final de objetos relevantes;
- pruebas positivas y negativas de RLS;
- pruebas de funciones, grants, constraints y triggers críticos;
- estrategia de seeds;
- CI con reconstrucción desde cero, lint, tipos y pruebas;
- reconciliación segura del historial remoto;
- y verificación controlada de drift.

Datos, Arquitectura, Operación y Seguridad deberán revisar la evidencia. La aprobación del Product Owner se registrará únicamente después de completar estos controles.

---

## 45. Estrategia de pruebas

Se probarán:

- base vacía a estado completo;
- baseline más todas las migraciones;
- seed;
- constraints;
- funciones;
- triggers;
- RLS;
- permisos;
- tipos;
- migración desde estado soportado;
- fallo parcial;
- reintento seguro;
- drift;
- y compatibilidad de código.

---

## 46. Riesgos y controles

| Riesgo | Condición | Impacto | Control | Propietario | Señal |
|---|---|---|---|---|---|
| Baseline incompleto | Objeto excluido | Alto | Inventario y comparación | Datos | Diff |
| Aplicar baseline en remoto | Historial mal reconciliado | Crítico | Ensayo y aprobación | Operación | Fallo o duplicado |
| Secreto en SQL | Export incorrecto | Crítico | Scan y revisión | Seguridad | Secret scanning |
| Drift | Cambio manual | Alto | Diff y política de emergencia | Datos | Esquema divergente |
| Lock prolongado | Migración pesada | Alto | Fases y runbook | Datos | Lock/latencia |
| RLS ausente | Policy no versionada | Crítico | CI negativa | Seguridad | Acceso indebido |
| Seed destructivo | Entorno incorrecto | Alto | Separación y guard | Datos | Mutación inesperada |
| CLI divergente | Versión no fijada | Medio | Pin y actualización controlada | Operación | CI distinta |

---

## 47. Plan de implementación

| Entrega | Alcance | Propietario | Evidencia |
|---|---|---|---|
| Inventario | Objetos desplegados | Datos | Catálogo revisado |
| Tooling local | Config y versión CLI | Operación | Servicios saludables |
| Baseline | SQL sin datos | Datos | Reset exitoso |
| Seguridad | RLS, grants y funciones | Seguridad | Suite positiva/negativa |
| Seeds | Catálogos y fixtures | Datos/QA | Repetibilidad |
| CI | Reset, tipos y tests | Ingeniería | Check requerido |
| Reconciliación | Historial de entornos | Datos/Operación | Diff vacío |
| Gobierno | Runbook y política | Arquitectura | Revisión aprobada |

---

## 48. Preguntas abiertas

Antes de Aceptado se resolverá:

- ¿qué objetos administrados deben excluirse?;
- ¿qué historial remoto existe?;
- ¿cómo se marcará el baseline como aplicado sin ejecutarlo sobre Production?;
- ¿qué seeds son contractuales?;
- ¿qué proyecto servirá para el ensayo?;
- ¿qué tiempo máximo de migración se acepta?;
- y ¿cómo se verificará drift en cada entorno?

---

## 49. Triggers de revisión

Este ADR se revisará cuando:

- cambie el proveedor de datos;
- se adopte un ORM como autoridad;
- se separen bases o servicios;
- Supabase cambie el workflow;
- el historial sea demasiado costoso de reconstruir;
- o una necesidad regulatoria cambie el proceso.

Fecha de revisión sugerida: después de completar baseline y antes de migrar ADR-0001.

---

## 50. Registro de aprobación

| Rol | Decisión | Fecha | Evidencia |
|---|---|---|---|
| Product Owner | Pendiente | — | — |
| Responsable de arquitectura | Pendiente | — | — |
| Responsable de datos | Pendiente | — | — |
| Responsable de operación | Pendiente | — | — |
| Responsable de seguridad | Consultado, pendiente | — | — |

El estado permanecerá Propuesto hasta completar validación y aprobaciones.

---

## 51. Historial

| Fecha | Cambio | Autor o rol |
|---|---|---|
| 2026-07-12 | Propuesta inicial | Responsable de arquitectura |
| 2026-08-02 | Extracción autorizada, baseline reproducible y actualización de evidencia del spike | Responsable de datos y arquitectura |
| 2026-08-10 | Runbook gobernado y comparador determinista para historial remoto; inventario de Production bloqueado por falta de acceso autorizado y sin escrituras | Responsable de datos y arquitectura |
| 2026-08-18 | Inventario remoto y drift sanitizado de Production; ledger ausente, dos versiones representadas y cinco no aplicadas; sin escrituras y con token temporal revocado | Responsable de datos y arquitectura |

Después de Aceptado, las correcciones decisorias requerirán un ADR nuevo.

---

## 52. Referencias

- [Registro ADR](README.md)
- [Plantilla ADR](0000-template.md)
- [ADR-0001: Tenant isolation](0001-tenant-isolation-model.md)
- [Arquitectura de datos](../data-architecture.md)
- [Arquitectura de seguridad](../security-architecture.md)
- [Arquitectura de despliegue](../deployment-architecture.md)
- [Estrategia de pruebas](../testing-strategy.md)

---

## 53. Resultado de la propuesta

Si se acepta, Git será la fuente verificable de evolución del esquema y cualquier entorno podrá reconstruirse desde un baseline más migraciones.

Si se rechaza, deberá elegirse una alternativa que ofrezca la misma reproducibilidad, revisión de seguridad, control de drift y recuperación antes de modificar el modelo multi-tenant.

### Ensayo de reconciliaci�n verificado (2026-08-18)

El procedimiento gobernado se ejecut� sobre la base local desechable
`cruma_reconciliation_rehearsal`, sin credenciales ni escrituras en Production:

- el ledger remoto comenz� ausente;
- las dos versiones del baseline se marcaron como aplicadas;
- las cinco migraciones incrementales se aplicaron mediante el flujo normal;
- el ledger termin� con las siete versiones de Git;
- el esquema p�blico coincidi� exactamente con la referencia local, con SHA-256
  `d7588443a96f968eceb8e92dbe55b26a4cc16708f4b43ad2cae66ea0e93d3b7e`;
- la base desechable fue eliminada autom�ticamente al finalizar.
---

## 54. Declaración final

> **El esquema de CRUMAFOOD no será conocimiento implícito dentro de un proyecto Supabase. Será un artefacto versionado, revisable y reproducible que permita comprender cada cambio, probar cada política y recuperar cada entorno con confianza.**
