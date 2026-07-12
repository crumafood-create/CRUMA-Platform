# ADR-0013: Adoptar Node.js 24 LTS y pnpm 10 como toolchain JavaScript

> **Propuesta:** fijar Node.js 24.18.0 para desarrollo y CI, declarar Node 24.x para Vercel, usar pnpm 10.34.5 como único gestor y versionar `pnpm-lock.yaml` con instalaciones congeladas.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-07-12 |
| Decisores | Responsable de arquitectura, responsable de operación y responsable de desarrollo |
| Consultados | Frontend, calidad, seguridad, datos, Mobile, Desktop y responsables de CI/CD |
| Informados | Product Owner, contributors y responsables de releases |
| Propietario | Platform Engineering/Operación, con corresponsabilidad de Desarrollo |
| Alcance | Node.js, pnpm, lockfile, package.json, CI, Vercel, desarrollo local, caché, upgrades y supply chain |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; requiere instalación limpia piloto antes de aceptación |
| Issues relacionados | Pendiente: ejecutar CI con Node exacto, validar Vercel Preview/Corepack, fijar Supabase CLI y obtener aprobaciones |

---

## 1. Resumen ejecutivo

El repositorio no contiene lockfile, `.nvmrc`, `packageManager`, `engines` ni instalación en CI. `package.json` contiene una dependencia duplicada y el workflow actual solo ejecuta checkout.

La decisión propuesta es:

> **CRUMAFOOD usará Node.js 24.18.0 LTS como runtime exacto en desarrollo y GitHub Actions, Node 24.x como major soportado en Vercel y pnpm 10.34.5 como único gestor. `pnpm-lock.yaml` será obligatorio; CI y builds usarán instalación frozen; y ningún otro lockfile será válido.**

pnpm 11 no se adopta todavía porque Vercel documenta soporte administrado hasta pnpm 10. La decisión se revisará cuando la plataforma confirme la línea 11.

---

## 2. Contexto

CRUMAFOOD utiliza o propone:

- Next.js 15;
- React 19;
- TypeScript;
- Supabase CLI;
- Storybook 10;
- Vitest;
- Playwright;
- Style Dictionary v4;
- GitHub Actions;
- y Vercel.

Todas estas herramientas dependen de una instalación JavaScript reproducible.

---

## 3. Estado actual

No existe:

- `pnpm-lock.yaml`;
- `package-lock.json`;
- `yarn.lock`;
- `.nvmrc`;
- `.node-version`;
- `.npmrc` del proyecto;
- campo `packageManager`;
- campo `engines`;
- instalación en GitHub Actions;
- ni validación de versión.

Vercel usaría npm por defecto al no encontrar lockfile.

---

## 4. Hallazgos del manifest

`package.json` contiene:

- `@tanstack/react-query` declarado dos veces;
- scripts mínimos;
- versiones exactas y rangos mezclados;
- lint basado en un comando que debe verificarse contra Next.js instalado;
- y ninguna política de engines o gestor.

La primera generación de lockfile deberá corregir el manifest antes de resolver dependencias.

---

## 5. Problema

Sin runtime, gestor y lockfile fijados:

- cada instalación puede resolver versiones distintas;
- local, CI y Vercel pueden usar herramientas diferentes;
- un build puede modificar el árbol de dependencias;
- no existe clave segura para caché CI;
- los incidentes son difíciles de reproducir;
- y ADR-0007, ADR-0011 y ADR-0012 permanecen bloqueados.

---

## 6. Alcance

Esta decisión cubre:

- major y patch de Node;
- package manager;
- versión de pnpm;
- lockfile;
- campos de `package.json`;
- archivos de versión;
- instalación local;
- GitHub Actions;
- Vercel;
- caché;
- workspaces futuros;
- scripts de paquetes;
- actualizaciones;
- seguridad;
- y migración desde el estado actual.

No define:

- versiones de todas las dependencias;
- monorepo inmediato;
- estrategia de Renovate/Dependabot definitiva;
- registry privado;
- publicación de paquetes;
- runtime Rust/Tauri;
- ni versión final de Supabase CLI.

---

## 7. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Reproducibilidad | Crítica | Runtime, gestor y lockfile fijados |
| Compatibilidad Vercel | Crítica | Línea de pnpm soportada y Node major permitido |
| Compatibilidad Storybook | Alta | Node cumple mínimo de Storybook 10 |
| CI | Crítica | Frozen install y cache por lockfile |
| Seguridad | Crítica | Supply chain, scripts y upgrades gobernados |
| Velocidad | Alta | Store eficiente y restaurable |
| Monorepo futuro | Media | Workspaces sin migración de gestor |
| Developer experience | Alta | Comandos iguales en local y CI |
| Longevidad | Alta | Node LTS, no Current/EOL |
| Reversibilidad | Alta | Lockfile y manifest estándar |

---

## 8. Restricciones

La decisión deberá respetar:

- Node soportado por Next.js 15;
- Node soportado por Storybook 10;
- Node y pnpm soportados por Vercel;
- GitHub Actions como autoridad CI;
- instalación determinista antes de gates;
- no modificar lockfile durante build;
- no mantener varios gestores;
- y no instalar dependencias como parte de este ADR documental.

---

## 9. Supuestos

La propuesta asume que:

- Node 24 LTS es compatible con el código actual;
- Vercel continuará soportando 24.x;
- pnpm 10.34.5 puede resolver el manifest corregido;
- Storybook 10 y herramientas propuestas funcionan en Node 24;
- no existen scripts de dependencias que requieran excepción insegura;
- y un futuro monorepo se beneficiará de pnpm workspaces.

El piloto confirmará estos supuestos.

---

## 10. Criterios de decisión

| Criterio | Prioridad | Evidencia |
|---|---|---|
| Soporte LTS | Crítica | Estado oficial de Node |
| Hosting | Crítica | Runtime y gestor aceptados por Vercel |
| Tooling | Crítica | Next, Storybook, Vitest y Playwright ejecutan |
| Lockfile | Crítica | Install limpia produce árbol estable |
| CI | Crítica | Frozen install y cache reproducibles |
| Seguridad | Alta | Integridad y scripts gobernados |
| Workspaces | Media | Camino a monorepo sin migración |
| Rendimiento | Alta | Tiempo y disco medidos |
| Portabilidad | Alta | Linux, macOS y Windows razonables |

---

## 11. Opciones consideradas

| Opción | Resumen | Resultado |
|---|---|---|
| A | Node 24 LTS + pnpm 10 | Elegida |
| B | Node 22 LTS + pnpm 10 | No elegida |
| C | Node 24 LTS + pnpm 11 | No elegida por ahora |
| D | Node 24 LTS + npm | No elegida |
| E | Node 24 LTS + Yarn | No elegida |
| F | Bun como runtime/gestor | No elegida |

---

## 12. Opción A — Node 24 + pnpm 10

Ventajas:

- Node LTS vigente;
- compatible con Storybook 10;
- Vercel soporta Node 24.x;
- Vercel documenta pnpm 10;
- instalación eficiente;
- workspaces maduros;
- y lockfile estricto.

Desventajas:

- Vercel fija solo major, no patch;
- pnpm requiere aprendizaje si el equipo usa npm;
- y Corepack tiene lifecycle propio y carácter experimental en algunos entornos.

---

## 13. Opción B — Node 22 + pnpm 10

Node 22 sigue en LTS y cumple Storybook 10.

No se elige porque Node 24 es la línea LTS más nueva soportada por Vercel y ofrece mayor horizonte antes de migración.

Se mantiene como fallback si el piloto descubre una incompatibilidad bloqueante documentada.

---

## 14. Opción C — pnpm 11

pnpm 11 es la línea estable más reciente y refuerza seguridad y arquitectura del store.

No se adopta todavía porque la documentación de Vercel enumera soporte administrado para pnpm 6–10.

Se reevaluará cuando Vercel soporte explícitamente 11 y el ecosistema del proyecto lo valide.

---

## 15. Opción D — npm

npm reduce herramientas adicionales y viene con Node.

No se elige porque pnpm ofrece store eficiente, instalación estricta y mejor ruta a workspaces/monorepo.

El beneficio deberá confirmarse en el piloto; npm permanece fallback si Vercel o pnpm bloquean producción.

---

## 16. Opción E — Yarn

Yarn es viable, pero añadiría otra decisión sobre Classic/Berry, PnP/node_modules y plugins sin ventaja demostrada para este repositorio.

Se descarta.

---

## 17. Opción F — Bun

Bun combina runtime y gestor, pero cambiaría más variables a la vez y no es necesario para Next.js/Vercel actual.

Se descarta para mantener Node como runtime de producción.

---

## 18. Decisión propuesta

CRUMAFOOD adoptará:

1. Node.js `24.18.0` en desarrollo y CI;
2. Node `24.x` en `package.json` y Vercel;
3. pnpm `10.34.5` exacto;
4. `packageManager: pnpm@10.34.5`;
5. `pnpm-lock.yaml` como único lockfile;
6. `.nvmrc` con patch exacto;
7. `pnpm install --frozen-lockfile` en CI;
8. caché basada en lockfile;
9. verificación de versiones al inicio del pipeline;
10. upgrades mediante Pull Request dedicado;
11. y fallback documentado a Node 22/npm solo si el piloto falla.

---

## 19. Versiones elegidas

| Herramienta | Desarrollo/CI | Producción Vercel | Política |
|---|---|---|---|
| Node.js | `24.18.0` | `24.x` administrado | Major fijo; patch exacto fuera de Vercel |
| pnpm | `10.34.5` | `10.34.5` si Corepack/config lo respeta; línea 10 como mínimo | Exacta y verificada en logs |
| npm | Bundled, solo bootstrap excepcional | No es gestor del proyecto | No genera lockfile |
| Corepack | Versión/control del entorno | Experimental en Vercel | No será única garantía |

---

## 20. Node LTS

Solo se usarán releases LTS soportadas.

No se promoverán:

- versiones Current;
- versiones impares EOL;
- majors fuera de soporte;
- ni patches no probados mediante cambio silencioso en CI.

Node 24 “Krypton” es LTS vigente al 2026-07-12.

---

## 21. Patch exacto y major de hosting

Desarrollo y GitHub Actions usarán `24.18.0` para reproducibilidad.

Vercel permite seleccionar `24.x` y aplica automáticamente actualizaciones minor/patch por seguridad y operación.

Por ello:

- no se afirmará paridad de patch con Vercel;
- el build registrará `node --version`;
- smoke tests confirmarán runtime;
- y una incompatibilidad de patch será incidente de plataforma.

---

## 22. `.nvmrc`

El repositorio tendrá:

```text
24.18.0
```

`.nvmrc` será la fuente exacta para herramientas locales compatibles y `actions/setup-node` mediante `node-version-file`.

No se añadirá `.node-version` inicialmente para evitar dos patches editables.

---

## 23. `engines`

`package.json` declarará:

```json
{
  "engines": {
    "node": "24.x",
    "pnpm": "10.34.5"
  }
}
```

Node usa major compatible con Vercel; pnpm permanece exacto.

CI verificará además el patch de `.nvmrc`.

---

## 24. `packageManager`

`package.json` declarará:

```json
{
  "packageManager": "pnpm@10.34.5"
}
```

Este campo permite a herramientas compatibles identificar y preparar el gestor correcto.

No sustituye el lockfile ni la validación CI.

---

## 25. Lockfile canónico

El único lockfile será:

```text
pnpm-lock.yaml
```

Se versionará en Git y se revisará como parte del Pull Request.

Se prohibirán simultáneamente:

- `package-lock.json`;
- `yarn.lock`;
- `bun.lock`;
- `bun.lockb`;
- y lockfiles anidados no aprobados.

---

## 26. Generación inicial del lockfile

Antes de generar se deberá:

1. corregir JSON y dependencias duplicadas;
2. revisar dependencias directas;
3. confirmar registry;
4. usar Node/pnpm elegidos;
5. ejecutar instalación limpia;
6. revisar warnings y peers;
7. auditar scripts;
8. ejecutar gates;
9. repetir en directorio limpio;
10. y comparar resultado.

El primer lockfile no se aceptará como ruido automático.

---

## 27. Instalación local

El flujo documentado será equivalente a:

```bash
nvm use
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
```

Si Corepack no está disponible o sus firmas fallan, se instalará pnpm 10.34.5 mediante mecanismo oficial verificado y se comprobará checksum/origen según la guía operativa.

---

## 28. Corepack

Corepack ayuda a respetar `packageManager`, pero no será una dependencia implícita ni única.

Controles:

- versión conocida;
- instalación desde fuente oficial;
- activación explícita;
- fallback documentado;
- y prueba en Vercel.

No se ejecutará `corepack prepare pnpm@latest` en CI.

---

## 29. GitHub Actions

El pipeline usará conceptualmente:

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10.34.5

- uses: actions/setup-node@v4
  with:
    node-version-file: .nvmrc
    cache: pnpm

- run: pnpm install --frozen-lockfile
```

Las acciones se fijarán por SHA en implementación de seguridad reforzada, aunque aquí se muestran tags legibles.

---

## 30. Orden de setup

La implementación confirmará el orden correcto entre setup de pnpm y setup de Node/cache según las acciones elegidas.

El resultado obligatorio es:

- pnpm disponible antes de restaurar store cuando la acción lo requiera;
- Node exacto;
- cache key con lockfile;
- y versión registrada.

No se copiará un snippet sin ejecutar el piloto.

---

## 31. Instalación frozen

En CI, Preview y Production se usará:

```bash
pnpm install --frozen-lockfile
```

Fallará cuando:

- manifest y lockfile diverjan;
- falte lockfile;
- el lockfile necesite actualización;
- o la versión sea incompatible.

El pipeline nunca corregirá el lockfile por su cuenta.

---

## 32. Vercel

Vercel se configurará con:

- Node `24.x` en `engines` y project settings;
- `pnpm-lock.yaml` en raíz;
- `packageManager` exacto;
- instalación frozen cuando el mecanismo lo permita;
- y logs de versión.

No se usará un override genérico `pnpm install` si provoca que Vercel seleccione una versión antigua.

---

## 33. Corepack en Vercel

Vercel requiere configuración explícita para Corepack experimental.

El piloto comparará:

- detección por lockfile;
- `packageManager` con Corepack habilitado;
- versión observada;
- y custom install command controlado.

Se elegirá el mecanismo más simple que demuestre pnpm 10.34.5 sin depender de comportamiento no documentado.

---

## 34. Diferencia de patch en Vercel

Vercel actualiza el patch de Node 24 automáticamente.

Los controles serán:

- build log con `node --version`;
- prueba de Next.js build;
- smoke de funciones;
- observación post-deploy;
- y rollback/roll-forward conforme ADR-0007.

No se bloquearán parches de seguridad administrados; se detectarán incompatibilidades temprano.

---

## 35. Caché de pnpm

Se cacheará el store de pnpm, no `node_modules` como autoridad.

La key incluirá:

- OS;
- arquitectura cuando aplique;
- Node major o exacto según riesgo;
- pnpm major/exacto;
- y hash de `pnpm-lock.yaml`.

Un cache miss deberá ser lento pero correcto.

---

## 36. `node_modules`

`node_modules` no se versionará.

No se compartirá como artifact entre entornos incompatibles.

Instalaciones corruptas se recuperarán eliminando estado local y reinstalando desde manifest/lockfile, no copiando directorios de otra máquina.

---

## 37. Store local

pnpm podrá reutilizar su content-addressable store local.

El store:

- no es source;
- puede purgarse;
- no se respalda como dato del producto;
- y no sustituye disponibilidad del registry o cache CI.

---

## 38. Scripts canónicos

Todos los flujos usarán scripts de `package.json`:

- `dev`;
- `build`;
- `start`;
- `format`;
- `typecheck`;
- `lint`;
- `test`;
- `test:integration`;
- `test:e2e`;
- `tokens:build`;
- `storybook`;
- `storybook:build`;
- y gates adicionales cuando se implementen.

CI no duplicará lógica compleja en YAML.

---

## 39. Ejecución de scripts

La forma canónica será:

```text
pnpm <script>
```

No se mezclarán en documentación o CI:

- `npm run`;
- `yarn`;
- `bun run`;
- y `npx` sin versión.

Para CLIs locales se preferirá script o `pnpm exec` con paquete declarado.

---

## 40. `pnpm dlx`

`pnpm dlx` solo se usará para bootstrap o diagnóstico explícito con versión exacta.

No se ejecutará `@latest` en CI o sobre el repositorio sin revisar cambios.

Herramientas recurrentes se declararán en `devDependencies` y se invocarán mediante scripts.

---

## 41. Dependencias directas

Toda dependencia importada por el código será directa en el package correspondiente.

No se dependerá de hoisting accidental o de una dependencia transitiva.

pnpm ayuda a detectar accesos no declarados; las excepciones de hoisting requerirán justificación.

---

## 42. Rangos y lockfile

La política inicial será:

- frameworks y tooling crítico: versión exacta;
- librerías estables: rango compatible aprobado cuando aporte mantenimiento;
- runtime/gestor: exactos donde el entorno lo permita;
- lockfile: resolución exacta de todo el árbol.

No se usarán `latest`, URLs móviles o ramas Git como dependencia productiva.

---

## 43. Peer dependencies

Los warnings de peer dependencies se revisarán, no se ocultarán globalmente.

Se evitará:

- `--force`;
- `--legacy-peer-deps`;
- overrides amplios;
- y peers incompatibles ignorados.

Una excepción tendrá issue, owner, versión objetivo y prueba.

---

## 44. Overrides

`pnpm.overrides` se permitirá para:

- vulnerabilidad;
- incompatibilidad transitoria;
- o resolución única documentada.

Cada override incluirá:

- motivo;
- enlace;
- owner;
- fecha;
- y criterio de retiro.

No se convertirá en catálogo permanente de conflictos no resueltos.

---

## 45. Scripts de instalación

Los lifecycle scripts de dependencias son superficie de supply chain.

Se revisarán paquetes que necesiten build scripts nativos o descarguen binarios, por ejemplo:

- Playwright;
- esbuild;
- sharp;
- SWC;
- y tooling nativo futuro.

Las aprobaciones de scripts serán mínimas, versionadas y verificadas.

---

## 46. Integridad

El lockfile deberá conservar integridad y resolución verificable.

Se investigará cualquier cambio inesperado de:

- tarball;
- checksum;
- registry;
- peer graph;
- lifecycle script;
- o paquete transitivo sensible.

No se editará manualmente el lockfile.

---

## 47. Registry

El registry público autorizado será `https://registry.npmjs.org/` mientras no exista decisión distinta.

`.npmrc` no contendrá tokens.

Registries privados requerirán:

- scope;
- autenticación;
- rotación;
- CI secrets;
- y fallback/continuidad.

---

## 48. `.npmrc`

La configuración de proyecto será mínima y versionada.

Podrá incluir controles aprobados como:

```ini
engine-strict=true
save-exact=false
```

El valor final de `save-exact` se alineará con la política de rangos y scripts de actualización.

No se copiará configuración personal, proxy o token.

---

## 49. Configuración personal

Proxy, certificados corporativos, store path y credenciales personales vivirán fuera del repositorio.

La documentación podrá explicar variables esperadas sin exponer valores.

Un build no dependerá de configuración oculta de una laptop.

---

## 50. Auditoría de dependencias

CI ejecutará análisis de vulnerabilidades con política de severidad y triage.

No se bloqueará únicamente por conteo bruto sin contexto.

Cada hallazgo considerará:

- explotabilidad;
- runtime/dev;
- ruta de uso;
- fix disponible;
- riesgo de upgrade;
- y plazo.

---

## 51. Licencias

Dependencias nuevas se revisarán por licencia, mantenimiento y procedencia.

El lockfile permite inventariar el árbol, pero no sustituye la política de licencias.

Paquetes con licencia incompatible o procedencia dudosa no se aprobarán por conveniencia.

---

## 52. Actualizaciones

Las actualizaciones se harán mediante Pull Request dedicado o agrupación coherente.

El PR incluirá:

- manifest;
- lockfile;
- changelog relevante;
- gates;
- build;
- seguridad;
- migración;
- y rollback.

No se ejecutará actualización masiva y se mezclará con una feature no relacionada.

---

## 53. Renovación de Node

Se revisará Node:

- mensualmente por parches;
- al anunciarse vulnerabilidad;
- al cambiar estado LTS;
- al acercarse EOL;
- y antes de major upgrades de Next/Storybook.

El patch de `.nvmrc` se actualizará mediante PR y matriz temporal cuando el riesgo lo amerite.

---

## 54. Renovación de pnpm

Los patches/minors de pnpm 10 se probarán mediante:

- regeneración controlada del lockfile;
- install limpia;
- comparación;
- gates completos;
- y build Vercel Preview.

pnpm 11 requiere revisión de este ADR o reemplazo.

---

## 55. Dependabot o Renovate

La automatización podrá proponer cambios, pero no fusionará majors o tooling crítico sin revisión.

La herramienta definitiva queda fuera de alcance.

Sus PR deberán respetar:

- agrupación;
- límites de frecuencia;
- CI;
- owners;
- y política de seguridad.

---

## 56. Monorepo futuro

pnpm ofrece ruta natural a workspaces.

No se creará `pnpm-workspace.yaml` hasta existir más de un package real o decisión de monorepo.

Cuando ocurra, se definirán:

- límites;
- catálogo de versiones;
- filtros;
- caching;
- publicación;
- y ownership.

---

## 57. Mobile Web y Desktop

Mobile Web y Desktop WebView compartirán el mismo toolchain frontend.

Tauri/Rust conservará Cargo y `Cargo.lock` bajo su propia autoridad cuando exista.

pnpm no gestionará crates ni binarios nativos fuera de adapters explícitos.

---

## 58. Supabase CLI

Supabase CLI se fijará como dependencia o mecanismo versionado compatible con ADR-0002.

No se invocará una versión global arbitraria en CI.

Su versión podrá evolucionar separadamente, pero la instalación deberá pasar por el mismo lockfile o artifact fijado.

---

## 59. Storybook y testing

ADR-0012 podrá implementar Storybook 10, Vitest y Playwright después de aceptar este toolchain.

El piloto verificará:

- ESM config;
- Vite;
- browser binaries;
- lifecycle scripts;
- y tamaño de instalación.

---

## 60. Design tokens

ADR-0011 ejecutará el generador DTCG mediante un script y dependencia fijados en el lockfile.

La salida no dependerá de una instalación global de Style Dictionary.

El mismo Node/pnpm deberá producir bytes equivalentes en local y CI.

---

## 61. CI/CD

ADR-0007 usará esta decisión para:

- setup;
- install;
- cache;
- scripts;
- artifact provenance;
- Preview;
- Production;
- y evidencia de runtime.

Sin install frozen no se ejecutarán gates posteriores.

---

## 62. Validación de versión

El pipeline registrará y verificará:

```bash
node --version
pnpm --version
pnpm config get registry
```

No imprimirá tokens o configuración sensible.

Una versión distinta a la esperada fallará en CI; Vercel validará major y registrará patch.

---

## 63. Build reproducible

Se ejecutarán dos instalaciones limpias del piloto, al menos una sin cache.

Deberán producir:

- mismo lockfile sin cambios;
- mismo conjunto de gates;
- build funcional;
- generación de tokens sin drift;
- Storybook build reproducible cuando exista;
- y artifacts comparables donde aplique.

---

## 64. Modo offline

`pnpm install --offline` podrá usarse solo cuando el store contenga todas las resoluciones necesarias.

No será la ruta canónica de CI.

La disponibilidad del store ayuda desarrollo, pero no reemplaza una estrategia de continuidad del registry.

---

## 65. Fallos y recuperación

Ante instalación corrupta:

1. confirmar versiones;
2. confirmar registry;
3. ejecutar sin cache;
4. validar integridad del lockfile;
5. purgar store solo si la evidencia lo justifica;
6. reinstalar frozen;
7. y comparar con CI.

No se regenerará lockfile como primera respuesta a todo fallo.

---

## 66. Consecuencias positivas

- instalaciones reproducibles;
- CI y local alineados;
- mejor uso de disco/cache;
- ruta a workspaces;
- versiones visibles;
- supply chain más gobernada;
- desbloqueo de tokens/Storybook/testing;
- y diagnóstico más sencillo.

---

## 67. Consecuencias negativas

- migración y aprendizaje de pnpm;
- Corepack/configuración adicional;
- diferencia de patch con Vercel;
- lockfile grande que requiere revisión;
- posible incompatibilidad de paquetes con pnpm estricto;
- y necesidad de mantener Node/pnpm activamente.

---

## 68. Riesgos y controles

| Riesgo | Control |
|---|---|
| Vercel no usa pnpm exacto | Logs, Corepack piloto y Preview |
| Node patch difiere | Major fijo, log y smoke |
| Lockfile inicial incorrecto | Manifest limpio y doble install |
| Peer incompatible | Sin force y excepción temporal |
| Script malicioso | Review y allowlist de build scripts |
| Cache corrupta | Ejecución sin cache y frozen install |
| pnpm 11 accidental | packageManager/engines exactos |
| Lockfile mixto | CI detecta archivos prohibidos |
| Corepack falla | Fallback oficial fijado |
| Upgrade rompe build | PR dedicado y Preview |

---

## 69. Plan de migración

### Fase 0 — Preparación

- revisar compatibilidad;
- corregir dependencia duplicada;
- definir owners;
- y crear branch/PR dedicado.

### Fase 1 — Runtime

- añadir `.nvmrc`;
- añadir `engines`;
- añadir `packageManager`;
- y documentar setup.

### Fase 2 — Lockfile

- instalar pnpm 10.34.5;
- generar `pnpm-lock.yaml`;
- revisar peers/scripts;
- y ejecutar build.

### Fase 3 — CI

- configurar setup-node/pnpm;
- frozen install;
- cache;
- y checks de versión/lockfiles.

### Fase 4 — Vercel

- fijar Node 24.x;
- verificar pnpm;
- desplegar Preview;
- ejecutar smoke;
- y documentar versiones observadas.

### Fase 5 — Tooling

- habilitar ADR-0011/0012;
- medir instalación;
- y solicitar aceptación.

---

## 70. Estrategia de rollback

Si pnpm bloquea el piloto antes de aceptación:

- se conservará el PR aislado;
- no se promoverá el lockfile;
- se documentará incompatibilidad;
- se evaluará npm con Node 24;
- y se actualizará o reemplazará este ADR.

No coexistirán dos lockfiles como rollback permanente.

---

## 71. Criterios para Aceptado

Este ADR podrá pasar a Aceptado cuando:

- manifest esté limpio y sin duplicados;
- `.nvmrc` y fields estén presentes;
- exista un único `pnpm-lock.yaml`;
- dos installs limpias no produzcan cambios;
- CI use Node 24.18.0 y pnpm 10.34.5;
- frozen install falle ante drift canario;
- cache miss sea funcional;
- Next.js build pase;
- Vercel Preview use Node 24.x y pnpm 10 probado;
- Supabase CLI tenga versión controlada;
- tooling piloto sea compatible;
- y Arquitectura, Operación, Desarrollo y Seguridad aprueben evidencia.

---

## 72. Preguntas abiertas

Antes de Aceptado se resolverá:

- ¿Vercel ejecuta exactamente pnpm 10.34.5 con la configuración elegida?;
- ¿qué patch de Node 24 usa Preview?;
- ¿Corepack se habilita o se evita en Vercel?;
- ¿qué lifecycle scripts requieren aprobación?;
- ¿qué peers aparecen al generar lockfile?;
- ¿qué versión de Supabase CLI se fija?;
- ¿se adopta `engine-strict`?;
- ¿qué bot propondrá upgrades?;
- ¿qué política exacta de rangos se aplica a cada categoría?;
- y ¿qué incompatibilidad justificaría Node 22 o npm?

### Validación inicial contra el repositorio — 2026-07-12

| Evidencia | Resultado | Conformidad |
|---|---|---|
| Node.js oficial | `24.18.0` es la versión LTS vigente | Conforme con la propuesta |
| pnpm oficial | `10.34.5` existe en la línea 10 publicada | Conforme con la propuesta |
| Vercel Node.js | `24.x` está disponible y solo se fija el major | Conforme con la propuesta |
| Vercel package managers | pnpm 10 está soportado; sin lockfile Vercel usa npm por defecto | Conforme con la decisión, repositorio no conforme |
| `package.json` | Declara `packageManager`, `engines`, scripts canónicos y dependencias directas requeridas | Conforme localmente |
| Manifest | Se eliminó el duplicado de `@tanstack/react-query` y el JSON es válido | Conforme |
| Runtime local | `.nvmrc` fija `24.18.0`; no se añadió `.node-version` | Conforme en repositorio; ejecución exacta pendiente en CI |
| Lockfile | `pnpm-lock.yaml` es el único lockfile y fue generado con pnpm `10.34.5` | Conforme |
| Configuración pnpm | `.npmrc` aplica `engine-strict`; `pnpm-workspace.yaml` allowlistea solo `sharp` y `unrs-resolver` | Conforme |
| GitHub Actions | CI configura pnpm `10.34.5`, lee `.nvmrc`, verifica versiones/lockfiles y ejecuta frozen install, typecheck, lint y build | Configurado; ejecución remota pendiente |
| Vercel | `engines.node` declara `24.x`, el lockfile identifica pnpm y `packageManager` fija `10.34.5` | Configuración de proyecto, Corepack y Preview pendientes |
| Supabase CLI | No existe versión controlada en el manifest | Pendiente |
| Instalación reproducible | Frozen install online y repetición offline conservaron el hash del lockfile | Conforme localmente |
| Typecheck y lint | `tsc --noEmit` y `eslint .` finalizaron correctamente | Conforme localmente |
| Build y Preview | `next build` generó 238 páginas con pnpm `10.34.5`; el entorno local usó Node `24.14.0` | Build local conforme; Node exacto y Preview pendientes |

**Resultado:** la selección de versiones conserva soporte oficial y la migración local satisface los gates técnicos disponibles en el repositorio. El ADR permanece **Propuesto** porque todavía debe observarse GitHub Actions con Node `24.18.0`, probarse Vercel Preview con Node `24.x` y pnpm `10.34.5`, fijarse Supabase CLI y completarse el registro de aprobación.

---

## 73. Métricas de la decisión

Se seguirá:

- installs frozen exitosas;
- drift failures;
- tiempo con/sin cache;
- tamaño del store/cache;
- cambios inesperados de lockfile;
- warnings de peers;
- lifecycle scripts aprobados;
- vulnerabilidades;
- versión local/CI/Vercel;
- frecuencia de upgrades;
- y fallos atribuibles al toolchain.

---

## 74. Triggers de revisión

Este ADR se revisará cuando:

- Node 24 entre en Maintenance o se acerque EOL;
- Vercel cambie runtimes;
- Vercel soporte pnpm 11;
- Next.js/Storybook requieran otro Node;
- se adopte monorepo;
- Corepack cambie o se retire;
- ocurra incidente supply-chain;
- el lockfile sea incompatible;
- o pnpm no aporte beneficio operativo.

---

## 75. Registro de aprobación

| Rol | Estado | Evidencia |
|---|---|---|
| Arquitectura | Pendiente | Compatibilidad y decisión |
| Operación | Pendiente | CI/Vercel y recuperación |
| Desarrollo | Pendiente | Setup local y scripts |
| Seguridad | Pendiente | Supply chain y lifecycle scripts |
| Calidad | Pendiente | Gates y reproducibilidad |
| Datos | Pendiente | Supabase CLI |

El texto no equivale a aprobación.

---

## 76. Historial

| Fecha | Cambio |
|---|---|
| 2026-07-12 | Creación de la propuesta ADR-0013 |
| 2026-07-12 | Validación inicial contra repositorio y fuentes oficiales; estado permanece Propuesto |
| 2026-07-12 | Migración local implementada y verificada; pendientes CI remoto, Vercel Preview, Supabase CLI y aprobaciones |

---

## 77. Referencias

- [Arquitectura de despliegue](../deployment-architecture.md)
- [Estrategia de pruebas](../testing-strategy.md)
- [ADR-0002 — Baseline y migraciones](0002-schema-baseline-and-migrations.md)
- [ADR-0007 — Pipeline CI/CD](0007-ci-cd-pipeline.md)
- [ADR-0011 — Formato de tokens](0011-canonical-design-token-format.md)
- [ADR-0012 — Storybook y pruebas visuales](0012-storybook-and-visual-testing.md)
- [Node.js — Releases](https://nodejs.org/en/about/previous-releases)
- [Node.js — Download](https://nodejs.org/en/download)
- [pnpm 10 — Installation](https://pnpm.io/10.x/installation)
- [pnpm — Continuous Integration](https://pnpm.io/continuous-integration)
- [Storybook 10 — Migration requirements](https://storybook.js.org/docs/releases/migration-guide)
- [Vercel — Supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel — Package Managers](https://vercel.com/docs/package-managers)
- [Vercel — Corepack](https://vercel.com/docs/builds/configure-a-build#corepack)

Las versiones y capacidades se verificaron el 2026-07-12. Node 24.18.0 era la última LTS, pnpm 10.34.5 la última línea 10 publicada y Vercel documentaba pnpm hasta major 10.

---

## 78. Resultado de la propuesta

La propuesta establece por primera vez una cadena reproducible desde manifest hasta Production.

Node 24 LTS aporta horizonte; pnpm 10 mantiene compatibilidad con Vercel; el lockfile fija resoluciones; CI impide drift; y los ADR de tokens, Storybook y testing pueden implementarse sobre una base conocida.

---

## 79. Declaración final

> **CRUMAFOOD construirá y probará cada commit con un runtime, un gestor y un árbol de dependencias identificables; ninguna instalación implícita ni lockfile ausente decidirá silenciosamente qué software llega a Production.**
