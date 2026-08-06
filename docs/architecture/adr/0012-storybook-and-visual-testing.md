# ADR-0012: Adoptar Storybook y regresión visual selectiva con Playwright

> **Decisión:** usar Storybook 10 con Next.js/Vite como catálogo ejecutable del design system; transformar stories tipadas en pruebas de render, interacción y accesibilidad; y comparar visualmente un conjunto selectivo mediante Playwright en un entorno reproducible.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Fecha | 2026-07-12 |
| Decisores | Product Owner, responsable de diseño, responsable de frontend, responsable de accesibilidad y responsable de calidad |
| Consultados | Arquitectura, desarrollo Web, Mobile, Desktop, operación y seguridad |
| Informados | Responsables de componentes, revisores de Pull Requests y usuarios del design system |
| Propietario | Design System y Quality Engineering, con corresponsabilidad de Frontend |
| Alcance | Catálogo, stories, documentación, interacción, accesibilidad, regresión visual, CI, baselines, revisión, publicación y gobierno |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; spike ejecutable completado y validado en local y GitHub Actions |
| Issues relacionados | Resueltos durante el piloto mediante configuración de Storybook, Vitest, Playwright, accesibilidad, baselines y CI |

---

## 1. Resumen ejecutivo

El repositorio contiene seis archivos `*.stories.tsx`, pero no declara dependencias, configuración, scripts, build, CI ni publicación de Storybook. Tampoco existen Vitest, Playwright, axe o baselines visuales verificables.

La decisión aceptada es:

> **CRUMAFOOD adoptará Storybook 10 mediante `@storybook/nextjs-vite` como catálogo ejecutable de primitives, componentes y patrones. Las stories usarán CSF tipado, datos sintéticos y estados deterministas. El addon de Vitest ejecutará render e interacciones; addon-a11y verificará reglas automatizables; y Playwright comparará screenshots seleccionados en Chromium/Linux fijado.**

Chromatic no se adopta inicialmente. La publicación será privada o mediante artefactos controlados, nunca pública por defecto.

---

## 2. Contexto

La arquitectura del Design System requiere:

- catálogo ejecutable;
- componentes documentados;
- temas light/dark;
- accesibilidad;
- estados extremos;
- responsive;
- pruebas visuales selectivas;
- y gobierno de cambios.

ADR-0011 propone DTCG JSON y salidas generadas. Storybook deberá consumir la misma cadena de tokens y demostrarla en componentes reales.

---

## 3. Estado actual

Existen stories para:

- ActivityFeed;
- DataList;
- MetricCard;
- StatCard;
- Status;
- y Timeline.

Estas stories:

- expresan ejemplos útiles;
- usan objetos default sin tipos Storybook explícitos;
- no tienen configuración ejecutable demostrada;
- no incluyen pruebas `play`;
- no tienen validación de accesibilidad;
- y no generan screenshots ni documentación publicada.

Su presencia no se considerará suite funcional.

---

## 4. Problema

Sin un catálogo ejecutable y una política visual:

- los estados difíciles permanecen ocultos;
- los componentes duplican ejemplos;
- cambios de tokens pueden romper múltiples superficies sin evidencia;
- una captura manual no es reproducible;
- actualizar snapshots puede ocultar regresiones;
- y accesibilidad se revisa demasiado tarde.

CRUMAFOOD necesita evidencia visual proporcional sin convertir cada pixel en una prueba frágil.

---

## 5. Alcance

Esta decisión cubre:

- framework Storybook;
- builder;
- ubicación y formato de stories;
- decorators;
- themes y viewports;
- datos y mocks;
- Autodocs;
- interacción;
- accesibilidad automatizada;
- visual regression;
- baselines;
- CI;
- artifacts;
- revisión humana;
- seguridad;
- mantenimiento;
- y migración.

No define:

- runner unitario general definitivo;
- E2E completos de aplicación;
- proveedor comercial de visual testing;
- hosting permanente;
- matriz final de navegadores/dispositivos;
- ni diseño visual final.

---

## 6. Principios

1. una story representa un estado útil y determinista;
2. Storybook documenta componentes, no reemplaza la aplicación;
3. visual regression será selectiva;
4. una diferencia exige revisión humana;
5. actualizar una baseline no equivale a aprobarla;
6. accesibilidad automatizada no sustituye revisión manual;
7. datos sintéticos y seguros;
8. misma cadena de tokens que Production;
9. pruebas en entorno fijado;
10. sin retries para ocultar flakiness;
11. componentes estables reciben mayor protección;
12. y evidencia proporcional al riesgo.

---

## 7. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Catálogo ejecutable | Crítica | Componentes aislados y estados navegables |
| Compatibilidad Next.js | Crítica | Router, Image, fonts y aliases |
| Pruebas modernas | Alta | Vitest y browser real |
| Accesibilidad | Crítica | axe, teclado y revisión manual |
| Determinismo visual | Crítica | OS, browser, fuentes y tiempo fijados |
| Costo | Alta | Evitar SaaS antes de necesidad medida |
| Revisión | Alta | Diffs disponibles en PR |
| Mantenimiento | Alta | Pocas herramientas y stories útiles |
| Seguridad | Crítica | Sin datos o endpoints de Production |
| Multiplataforma | Alta | Viewports y WebView representativos |

---

## 8. Restricciones

La decisión deberá respetar:

- Next.js 15 actualmente instalado;
- Tailwind CSS 3;
- tokens DTCG generados por ADR-0011;
- `src/shared` como ubicación del design system;
- CI/CD gobernado por ADR-0007;
- datos sintéticos;
- secretos fuera de artifacts;
- estado Propuesto hasta ejecutar spike;
- y decisión pendiente de Node/gestor de paquetes.

---

## 9. Supuestos

La propuesta asume que:

- Storybook 10 es compatible con el Node que se aprobará;
- Vite puede representar los componentes actuales;
- no existe configuración Webpack/Babel incompatible;
- Chromium cubre el baseline inicial;
- los snapshots caben razonablemente en Git;
- y el equipo puede revisar diffs visuales en Pull Requests.

El spike deberá confirmar estos supuestos.

---

## 10. Criterios de decisión

| Criterio | Prioridad | Evaluación |
|---|---|---|
| Next.js | Crítica | Componentes actuales compilan y renderizan |
| Developer experience | Alta | Inicio, HMR y debugging |
| Testing | Crítica | Render, play, axe y screenshots |
| CI | Crítica | Build y suites reproducibles |
| Costo | Alta | Sin servicio obligatorio inicial |
| Revisión visual | Alta | Diff y evidencia comprensibles |
| Seguridad | Crítica | Build sin datos/secrets reales |
| Portabilidad | Alta | Stories reutilizables y salida estática |
| Madurez | Alta | Versiones estables y documentación oficial |

---

## 11. Opciones consideradas

| Opción | Resumen | Resultado |
|---|---|---|
| A | Storybook + Vitest + axe + Playwright visual | Elegida |
| B | Storybook + Chromatic | No elegida inicialmente |
| C | Playwright solo contra aplicación | No elegida como catálogo |
| D | Capturas manuales | No elegida |
| E | No adoptar catálogo | No elegida |

---

## 12. Opción A — Stack abierto y local

Storybook aísla estados; Vitest ejecuta stories; axe detecta reglas automatizables; Playwright captura y compara.

Ventajas:

- control de costos;
- ejecución local y CI;
- baselines versionadas;
- integración con estrategia de pruebas;
- y salida del proveedor sencilla.

Desventajas:

- la revisión de diffs requiere artifact o tooling propio;
- snapshots dependen del entorno;
- y el equipo opera el pipeline.

---

## 13. Opción B — Chromatic

Chromatic ofrece infraestructura, navegadores y flujo de aprobación visual integrado con Storybook.

No se elige inicialmente porque:

- añade servicio, cuenta y costo potencial;
- requiere decisión de acceso y retención;
- y el volumen/colaboración todavía no demuestra la necesidad.

Se reevaluará cuando la revisión manual de artifacts sea un cuello de botella o se requiera matriz cross-browser administrada.

---

## 14. Opción C — Playwright solo

Playwright contra la aplicación valida recorridos reales, pero no ofrece por sí solo catálogo, estados aislados, documentación de componentes ni controls.

Se mantendrá para E2E y complementará Storybook, no lo sustituirá.

---

## 15. Opción D — Capturas manuales

Las capturas adjuntas a PR ayudan a comunicar, pero no son reproducibles, exhaustivas ni comparables automáticamente.

Se permitirán como evidencia complementaria, no como estrategia.

---

## 16. Decisión propuesta

CRUMAFOOD adoptará:

1. Storybook major 10, versión exacta fijada en lockfile;
2. `@storybook/nextjs-vite`;
3. CSF tipado;
4. Autodocs para componentes aptos;
5. Vitest addon para render e interacción;
6. addon-a11y con política gradual;
7. Playwright para visual regression selectiva;
8. Chromium/Linux como baseline inicial;
9. snapshots versionadas en Git;
10. artifacts de actual/diff en CI;
11. publicación no pública por defecto;
12. y Chromatic como trigger de revisión futuro.

---

## 17. Dependencia de ADR-0013

La instalación esperará la decisión de gestor de paquetes y versión de Node.

ADR-0013 deberá confirmar:

- Node compatible con Storybook 10;
- gestor y lockfile;
- comandos reproducibles;
- caché CI;
- y política de upgrades.

Este ADR define arquitectura, no autoriza una instalación inconsistente.

---

## 18. Framework

Se usará `@storybook/nextjs-vite` porque la documentación oficial lo recomienda para la mayoría de proyectos Next.js y habilita mejor soporte de testing con Vitest.

Se cambiará a la integración Webpack solo si el spike demuestra una incompatibilidad real con:

- configuración custom;
- Server Components;
- módulos;
- o comportamiento crítico de Next.js.

La excepción quedará documentada.

---

## 19. Alcance de Server Components

El soporte de React Server Components en Storybook se tratará como limitado o experimental según la versión.

Las stories se concentrarán primero en:

- primitives;
- Client Components;
- componentes presentacionales;
- y patrones con adapters controlados.

Los Server Components complejos se probarán mediante integración o E2E cuando Storybook no reproduzca fielmente su runtime.

---

## 20. Configuración objetivo

La estructura será:

```text
.storybook/
  main.ts
  preview.tsx
  manager.ts
  vitest.setup.ts
  preview-head.html       # solo si existe necesidad documentada
src/**/[name].stories.tsx
tests/visual-storybook/
  visual.spec.ts
  visual.spec.ts-snapshots/
```

No se crearán archivos vacíos como evidencia de adopción.

---

## 21. Scripts canónicos

Después de ADR-0013 se definirán comandos equivalentes a:

```text
storybook
storybook:build
storybook:test
storybook:test:a11y
storybook:test:visual
storybook:update-visual
```

El comando de actualización de baselines nunca se ejecutará automáticamente en CI.

---

## 22. Ubicación de stories

Las stories se colocarán junto al componente:

```text
button.tsx
button.stories.tsx
button.test.tsx          # solo cuando exista prueba distinta a la story
```

La proximidad mejora ownership y evita un catálogo desconectado.

Stories de patrones amplios podrán vivir junto al patrón correspondiente.

---

## 23. Formato CSF

Se usará Component Story Format tipado con `Meta` y `StoryObj`.

Ejemplo conceptual:

```ts
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Status } from './status';

const meta = {
  title: 'Data Display/Status',
  component: Status,
  tags: ['autodocs'],
} satisfies Meta<typeof Status>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { label: 'Completado', variant: 'success' },
};
```

---

## 24. Jerarquía del catálogo

La taxonomía inicial será:

```text
Foundations/
Primitives/
Forms/
Data Display/
Feedback/
Overlays/
Navigation/
Layouts/
Patterns/
Mobile/
Desktop/
Deprecated/
```

No se organizará por nombre de persona, sprint o página accidental.

---

## 25. Maturity tags

Los componentes mantendrán estado:

- experimental;
- candidate;
- stable;
- deprecated;
- y removed.

Los tags o metadata de Storybook permitirán filtrar:

- documentación;
- visual tests;
- accesibilidad;
- interacción;
- y madurez.

Solo `stable` será contrato general.

---

## 26. Cobertura de stories

Un componente estable documentará cuando aplique:

- default;
- variantes;
- tamaños;
- disabled;
- loading;
- empty;
- error;
- success;
- contenido corto y extremo;
- light/dark;
- viewport relevante;
- teclado/foco;
- y reduced motion.

No se crearán combinaciones cartesianas sin valor.

---

## 27. Datos

Las stories usarán datos:

- sintéticos;
- deterministas;
- legibles;
- representativos;
- sin secretos;
- sin PII real;
- y sin depender de Production.

Nombres como “Juan” o “María” serán ejemplos sintéticos explícitos y no copias de clientes.

---

## 28. Tiempo y aleatoriedad

Se fijarán:

- fecha;
- zona horaria;
- locale;
- random seed;
- IDs;
- y animaciones cuando afecten screenshots.

Textos como “Hace 5 min” no se calcularán desde el reloj real en visual tests.

---

## 29. Red y mocks

Las stories no llamarán Production.

Se preferirá:

- props;
- ports/adapters fake;
- loaders deterministas;
- module mocking aprobado;
- o MSW si un spike demuestra necesidad.

Cada mock conservará el contrato que pretende representar y tendrá estados de error/latencia cuando sean relevantes.

---

## 30. Providers

Los decorators globales reproducirán solo infraestructura visual necesaria:

- tokens CSS;
- Tailwind/global styles;
- theme provider;
- locale;
- router controlado;
- y query client aislado cuando aplique.

No se inicializará una sesión real ni cliente Supabase de Production.

---

## 31. Next.js routing

Las stories que usen `next/navigation` declararán App Router y parámetros necesarios según la integración oficial.

Se probarán:

- pathname;
- params;
- search params;
- locale;
- y acciones de navegación cuando sean parte del contrato.

Storybook no sustituirá E2E para middleware o autorización real.

---

## 32. Fuentes

Las fuentes deberán cargarse de forma determinista.

Se preferirán fuentes locales o mocks de respuestas externas en CI.

No se permitirá que Google Fonts u otra red externa vuelva flaky el build o altere screenshots.

El fallback usado por visual tests será parte de la baseline.

---

## 33. Tokens

Storybook importará los artefactos generados por ADR-0011.

No tendrá:

- paleta paralela;
- CSS manual alternativo;
- variables con otros nombres;
- ni theme values duplicados.

Un drift de tokens deberá fallar antes de capturar baselines nuevas.

---

## 34. Temas

La toolbar permitirá seleccionar:

- light;
- dark;
- y, para revisión manual, system cuando sea estable.

Visual regression capturará light y dark para el conjunto protegido.

System no será baseline porque depende del entorno del runner.

---

## 35. Viewports

Se definirán pocos viewports representativos:

- Mobile compacto;
- Mobile amplio;
- Tablet/operación;
- Desktop estándar;
- y Desktop amplio cuando un layout lo requiera.

Las cifras definitivas dependerán de ADR-0011 y evidencia de dispositivos.

No se probará cada ancho posible.

---

## 36. Densidad y Desktop

Desktop WebView compartirá stories de componentes Web y podrá añadir escenarios de:

- densidad;
- teclado;
- ventana estrecha;
- hardware desconectado;
- impresión;
- y estados nativos simulados.

Storybook Web no demostrará integración Tauri o hardware real.

---

## 37. Autodocs

Autodocs se habilitará para componentes candidate/stable con API clara.

La documentación incluirá:

- propósito;
- cuándo usar;
- cuándo no usar;
- props;
- variantes;
- accesibilidad;
- contenido;
- ejemplos;
- antipatrones;
- y madurez.

Una tabla automática de props no sustituye guía de uso.

---

## 38. MDX

MDX se reservará para foundations y guías amplias:

- tokens;
- color;
- tipografía;
- spacing;
- accesibilidad;
- patrones;
- y contribución.

No se duplicará cada story en una página MDX manual.

---

## 39. Pruebas de render

El addon de Vitest transformará stories en pruebas de componente.

Una story protegida deberá al menos:

- importar;
- renderizar;
- resolver decorators;
- no lanzar error;
- y completar loaders.

Renderizar no demuestra interacción ni accesibilidad.

---

## 40. Interaction tests

Los componentes interactivos usarán `play` para comportamientos de usuario:

- click;
- teclado;
- foco;
- apertura/cierre;
- selección;
- validación;
- loading;
- error;
- y recuperación.

Las aserciones usarán roles y nombres accesibles.

---

## 41. Límite con unitarias

Stories prueban composición y comportamiento observable del componente.

Las unitarias seguirán cubriendo:

- lógica pura;
- reducers;
- formatters;
- variantes complejas;
- y casos donde el DOM no aporta valor.

No se forzará toda lógica dentro de una story.

---

## 42. Accesibilidad automatizada

`addon-a11y` se integrará con Vitest.

Política gradual:

- `stable`: violaciones configuradas como error;
- `candidate`: error salvo deuda registrada;
- `experimental`: warning temporal permitido;
- `deprecated`: no se añaden nuevas violaciones.

Las excepciones tendrán propietario, motivo y fecha.

---

## 43. Accesibilidad manual

Además de axe se revisará:

- teclado completo;
- orden de foco;
- focus visible;
- lector de pantalla en patrones críticos;
- zoom;
- reflow;
- contraste;
- touch targets;
- reduced motion;
- y contenido no dependiente solo de color.

Storybook facilita la revisión, pero no la automatiza toda.

---

## 44. Regresión visual

La regresión visual se aplicará a:

- tokens y foundations seleccionados;
- primitives stable;
- componentes stable;
- layouts críticos;
- estados de error;
- recibos;
- etiquetas;
- y patrones operativos de alto impacto.

No toda story tendrá snapshot desde el primer día.

---

## 45. Runner visual

Playwright abrirá el Storybook estático y usará comparaciones mediante `toHaveScreenshot()`.

El runner fijará:

- imagen o runner Linux;
- versión de Chromium;
- viewport;
- device scale factor;
- locale;
- timezone;
- color scheme;
- reduced motion;
- y fonts.

Las baselines se generarán en el mismo entorno de CI.

---

## 46. Browser inicial

Chromium será el único browser de baseline inicial.

Firefox y WebKit se añadirán cuando:

- exista soporte contractual;
- un componente use APIs sensibles al motor;
- haya incidentes;
- o el costo de mantenimiento sea aceptado.

E2E podrá tener una matriz distinta.

---

## 47. Matriz visual

Cada caso visual se identifica por:

```text
story-id / theme / viewport / browser / platform
```

La matriz se limitará mediante tags.

Ejemplo:

- Button: light/dark, mobile/desktop;
- DataTable: light/dark, desktop;
- Mobile task card: light, mobile;
- receipt: light, print viewport.

---

## 48. Baselines

Las imágenes esperadas se versionarán junto a los tests.

Cada baseline tendrá:

- nombre estable;
- story ID estable;
- entorno fijado;
- owner;
- y commit de aprobación.

Renombrar una story no deberá borrar evidencia sin revisión.

---

## 49. Actualización de baselines

El flujo será:

1. ejecutar comparación;
2. inspeccionar expected/actual/diff;
3. determinar intención;
4. corregir regresión o regenerar localmente en runner equivalente;
5. incluir nuevas baselines en PR;
6. obtener aprobación visual;
7. y registrar cambio relevante.

CI nunca ejecutará `--update-snapshots` automáticamente.

---

## 50. Tolerancias

Las tolerancias serán pequeñas y justificadas.

No se aumentará `maxDiffPixels` globalmente para ocultar ruido.

Se preferirá eliminar fuentes de no determinismo:

- animaciones;
- timestamps;
- antialiasing por entorno;
- recursos remotos;
- cursores;
- y contenido aleatorio.

---

## 51. Animaciones

Visual tests usarán reduced motion o desactivación controlada.

Las animaciones que sean contrato se probarán mediante estados o interacción, no capturando un frame aleatorio.

Transiciones no deberán impedir que Playwright determine estabilidad.

---

## 52. Charts y canvas

Gráficos, canvas y contenido dependiente de medición pueden producir ruido.

Se probarán mediante:

- datos fijos;
- tamaño fijo;
- fonts fijas;
- animación desactivada;
- y screenshot solo si aporta evidencia.

La semántica de datos tendrá pruebas adicionales fuera del pixel diff.

---

## 53. Diff artifacts

Ante fallo, CI conservará:

- expected;
- actual;
- diff;
- metadata del runner;
- logs;
- y enlace al story build cuando sea seguro.

Los artifacts tendrán retención limitada y no contendrán datos reales.

---

## 54. Revisión humana

Los cambios visuales protegidos requerirán revisión de:

- Design System o diseño para semántica/apariencia;
- Frontend para implementación;
- y Accesibilidad cuando cambie foco, contraste o interacción.

Un bot detecta diferencia; las personas deciden si es correcta.

---

## 55. CI de Pull Request

El pipeline propuesto ejecutará:

1. instalación determinista;
2. generación/validación de tokens;
3. build de Storybook;
4. render/interacciones con Vitest;
5. axe;
6. visual tests seleccionados;
7. upload de artifacts;
8. y status requerido según madurez.

El build visual dependerá del mismo commit que se revisa.

---

## 56. Selección de pruebas

Inicialmente se priorizará seguridad sobre selección demasiado inteligente.

Cuando la suite crezca se podrá usar:

- tags;
- paths afectados;
- dependencias de tokens;
- y sharding.

Un cambio global de tokens o globals ejecutará todas las baselines.

---

## 57. Publicación

Storybook no será público por defecto.

Etapa inicial:

- build estático en CI;
- artifact descargable por revisores autorizados;
- y Preview controlado solo si el acceso está resuelto.

La publicación permanente requerirá:

- autenticación;
- owner;
- retención;
- dominio;
- y revisión de exposición.

---

## 58. Seguridad del catálogo

Storybook no contendrá:

- secretos;
- tokens de acceso;
- payloads productivos;
- nombres reales de clientes;
- endpoints privados operativos;
- configuraciones internas sensibles;
- ni acciones capaces de modificar Production.

El build estático se tratará como código potencialmente visible.

---

## 59. Environment variables

Solo variables públicas sintéticas o valores fake aprobados estarán disponibles al build.

La ausencia de un secreto deberá producir mock controlado, no acceso alternativo.

CI inspeccionará artifacts para patrones sensibles cuando corresponda.

---

## 60. Addons aprobados

El conjunto inicial será mínimo:

- essentials incluidos/requeridos por la versión;
- Vitest addon;
- accessibility addon;
- viewport/backgrounds/controls cuando formen parte de essentials;
- y documentación.

Cada addon adicional evaluará mantenimiento, licencia, bundle, seguridad y necesidad.

---

## 61. Performance

Se medirá:

- tiempo de inicio;
- tiempo de build;
- memoria;
- tamaño del artifact;
- duración de component tests;
- duración visual;
- y número de snapshots.

La suite no se ampliará sin observar su costo en CI.

---

## 62. Flakiness

Una prueba flaky se tratará como defecto.

Se investigará:

- red;
- tiempo;
- animación;
- fonts;
- orden;
- estado compartido;
- browser;
- recursos;
- y tolerancia.

La cuarentena será temporal, con owner, issue y expiración. No se reintentará hasta verde indefinidamente.

---

## 63. Ownership

| Artefacto | Propietario |
|---|---|
| Configuración Storybook | Design System/Frontend |
| Story de componente | Propietario del componente |
| Interaction test | Frontend/Quality |
| Regla axe | Accesibilidad |
| Baseline visual | Diseño + componente |
| Runner Playwright | Quality Engineering |
| CI y artifacts | Platform/Operación |

---

## 64. Definition of Done de componente stable

Un componente stable tendrá:

- API tipada;
- stories de estados relevantes;
- datos sintéticos;
- docs de uso;
- light/dark cuando aplique;
- responsive cuando aplique;
- interacción automatizada si es interactivo;
- axe sin violaciones no aceptadas;
- baseline visual si está en el conjunto protegido;
- y owner.

---

## 65. Límite con E2E

Storybook valida componentes y patrones aislados.

Playwright E2E de la aplicación valida:

- routing real;
- Auth;
- RLS;
- Server Actions;
- persistencia;
- integraciones;
- y recorridos de negocio.

No se eliminarán E2E críticos porque el componente tenga stories.

---

## 66. Límite con unit tests

Una screenshot no verifica:

- cálculo;
- autorización;
- contrato de datos;
- invariantes;
- idempotencia;
- ni persistencia.

La suite visual complementa, no reemplaza, las capas de `testing-strategy.md`.

---

## 67. Migración de stories existentes

Las seis stories actuales se migrarán a:

- `Meta`/`StoryObj` tipados;
- semicolon/formato del proyecto;
- tags y madurez;
- decorators comunes;
- datos deterministas;
- y pruebas de render.

Después se añadirá cobertura de estados faltantes sin multiplicar combinaciones innecesarias.

---

## 68. Piloto

El piloto incluirá:

- Button;
- Input;
- Card;
- Status;
- MetricCard;
- un componente interactivo;
- un patrón Mobile;
- light/dark;
- dos viewports;
- `play` test;
- axe;
- y tres a cinco baselines visuales representativas.

No se migrará todo el catálogo antes de demostrar el pipeline.

---

## 69. Consecuencias positivas

- catálogo ejecutable;
- estados difíciles visibles;
- documentación junto al código;
- interacción reutilizable como prueba;
- accesibilidad más temprana;
- cambios visuales detectables;
- validación de tokens y temas;
- y plataforma de colaboración sin SaaS obligatorio inicial.

---

## 70. Consecuencias negativas

- dependencias y configuración adicionales;
- build y CI más largos;
- mantenimiento de snapshots;
- sensibilidad a fonts/OS/browser;
- riesgo de stories desactualizadas;
- artifacts que requieren revisión manual;
- y cobertura cross-browser limitada inicialmente.

---

## 71. Riesgos y controles

| Riesgo | Control |
|---|---|
| Storybook difiere de Next.js | nextjs-vite, spike y E2E complementario |
| Baselines ruidosas | Runner fijado y determinismo |
| Snapshot update automático | Prohibido en CI y revisión obligatoria |
| Falsa accesibilidad | axe + revisión manual |
| Datos sensibles | Synthetic-only y artifact scan |
| Suite lenta | Selección, tags y medición |
| Story drift | DoD y ownership |
| Addon abandonado | Allowlist mínima y upgrades |
| Git crece por imágenes | Selección y revisión periódica |
| Chromium oculta diferencias | Triggers para ampliar matriz |

---

## 72. Plan de implementación

### Fase 0 — Precondiciones

- aceptar ADR-0013;
- fijar Node y gestor;
- confirmar versiones compatibles;
- y asignar owners.

### Fase 1 — Storybook mínimo

- instalar Storybook 10 exacto;
- configurar nextjs-vite;
- importar tokens/globals;
- configurar themes/viewports;
- y compilar las stories existentes.

### Fase 2 — Component tests

- añadir Vitest addon;
- tipar stories;
- incorporar play functions;
- añadir addon-a11y;
- y ejecutar en CI.

### Fase 3 — Visual

- configurar Playwright;
- fijar runner;
- seleccionar baselines;
- generar desde CI;
- y publicar diffs como artifacts.

### Fase 4 — Gobierno

- documentar contribución;
- integrar DoD;
- revisar costo/flakiness;
- y decidir hosting o Chromatic con evidencia.

---

## 73. Criterios para Aceptado

Este ADR podrá pasar a Aceptado cuando:

- ADR-0013 resuelva Node/gestor;
- Storybook arranque y haga build;
- las seis stories actuales compilen tipadas;
- tokens/globals sean los mismos de Production;
- light/dark funcionen;
- un play test se ejecute en browser;
- axe falle ante una violación canaria;
- Playwright detecte una regresión canaria;
- expected/actual/diff estén disponibles;
- CI no actualice baselines;
- el artifact no exponga secretos;
- y Diseño, Frontend, Accesibilidad y Calidad aprueben el piloto.

---

## 74. Decisiones cerradas para aceptación

Antes de aceptar este ADR se resolvieron las preguntas del piloto:

- la versión aprobada es Storybook 10.5.6 con Node 24.14.0 y pnpm 10.34.5;
- `@storybook/nextjs-vite` reproduce los imports utilizados por los componentes actuales del piloto;
- se consideran `stable` únicamente los componentes incorporados explícitamente al catálogo y protegidos por owner, stories deterministas y pruebas aplicables;
- el baseline inicial usa Chromium/Linux, viewport Desktop Chrome de 1280 × 720 CSS px y tema light;
- nuevos viewports o tema dark se añadirán únicamente cuando el riesgo del componente lo justifique;
- las pruebas visuales no dependerán de fonts remotas no controladas; cualquier font crítica deberá estar versionada o disponible de forma determinista en el entorno de ejecución;
- la tolerancia global aprobada es `maxDiffPixels: 0`; una excepción deberá ser local, justificada y revisada;
- el presupuesto inicial será de hasta 25 baselines visuales activas; superar ese límite requerirá revisar costo, flakiness y tiempo de CI;
- los diffs se revisarán mediante artifacts de GitHub Actions con `expected`, `actual`, `diff`, reporte HTML, contexto y trace cuando estén disponibles;
- los artifacts visuales tendrán una retención de 7 días;
- Chromatic solo se reconsiderará cuando se requiera revisión visual administrada, cobertura cross-browser, colaboración de Diseño a mayor escala o cuando los artifacts propios dejen de ser suficientes;
- las actualizaciones de baseline continuarán siendo manuales, revisadas y nunca automáticas en CI.

---

## 75. Métricas de la decisión

Se seguirá:

- componentes stable con stories;
- stories que renderizan;
- interaction tests;
- violaciones axe;
- baselines protegidas;
- regresiones detectadas;
- falsos positivos visuales;
- flakiness;
- tiempo de build/test;
- tamaño de artifact/snapshots;
- y tiempo humano de revisión.

---

## 76. Triggers de revisión

Este ADR se revisará cuando:

- cambie Storybook major;
- cambie Next.js major;
- nextjs-vite no reproduzca Production;
- se adopte UI nativa;
- se requiera cross-browser administrado;
- artifacts sean insuficientes;
- el costo de snapshots crezca materialmente;
- Chromatic u otro servicio aporte ROI demostrable;
- o la suite supere el presupuesto de CI.

---

## 77. Registro de aprobación

| Rol | Estado | Evidencia |
|---|---|---|
| Product Owner | Aprobado | Rafael Ríos aprueba prioridad, alcance y costo operativo del piloto |
| Diseño | Aprobado | Rafael Ríos aprueba catálogo, política de baselines y revisión visual selectiva |
| Frontend | Aprobado | Rafael Ríos aprueba la integración Storybook 10, Next.js/Vite y pruebas en navegador |
| Accesibilidad | Aprobado | Rafael Ríos aprueba la política inicial de axe, canaria automatizada y revisión manual proporcional |
| Calidad | Aprobado | Rafael Ríos aprueba Vitest, Playwright, tolerancia visual y controles de flakiness |
| Operación | Aprobado | Rafael Ríos aprueba CI, artifacts, retención de 7 días y escaneo previo a publicación |

Rafael Ríos, en calidad de Product Owner y autoridad delegada para Diseño, Frontend, Accesibilidad, Calidad y Operación durante esta etapa, aprueba formalmente el ADR-0012.

---

## 78. Historial

| Fecha | Cambio |
|---|---|
| 2026-07-12 | Creación de la propuesta ADR-0012 |
| 2026-08-03 | Ejecución del spike técnico de Storybook, Vitest y Playwright; el ADR permanece Propuesto |
| 2026-08-04 | Incorporación y validación de la primera `play function` en Chromium; el ADR permanece Propuesto |
| 2026-08-04 | Validación de una violación canaria `button-name` con axe y comprobación de su remediación; el ADR permanece Propuesto |
| 2026-08-04 | Validación de una regresión visual canaria con Playwright y generación de artifacts `expected/actual/diff`; el ADR permanece Propuesto |
| 2026-08-05 | Integración de Storybook y Playwright visual en GitHub Actions mediante el PR #37; ejecución normal aprobada en `main` |
| 2026-08-05 | Validación del PR canario #38: CI detectó la regresión visual, escaneó y publicó artifacts seguros y terminó en fallo; el PR se cerró sin fusionar |
| 2026-08-05 | Aprobación formal del ADR-0012 por Rafael Ríos como Product Owner y autoridad delegada de Diseño, Frontend, Accesibilidad, Calidad y Operación; estado cambiado a Aceptado |

---

## 79. Evidencia del spike ejecutable

El spike técnico se ejecutó el 2026-08-03 sobre:

- Next.js 15.5.19;
- React 19.1.0;
- Node 24.14.0;
- pnpm 10.34.5;
- Storybook 10.5.6;
- `@storybook/nextjs-vite` 10.5.6;
- Vitest 4.1.10;
- Vite 8.2.0;
- Playwright 1.62.1;
- y Chromium headless en Linux/Codespaces.

La implementación comprobó:

- arranque y build estático de Storybook;
- integración de `@storybook/nextjs-vite`;
- carga de `src/app/globals.css`;
- carga de los tokens existentes del design system;
- seis archivos de stories junto a sus componentes;
- migración de las seis stories a CSF tipado con `Meta` y `StoryObj`;
- separación entre el proyecto Vitest `unit` y el proyecto `storybook`;
- ejecución de stories en Chromium mediante `@vitest/browser-playwright`;
- integración de `addon-a11y` con política inicial `todo`;
- reglas ESLint específicas para Storybook sin imponer una migración global del código existente;
- y ausencia de Chromatic en dependencias y configuración.

Resultados reproducidos localmente:

| Validación | Resultado |
|---|---|
| `pnpm typecheck` | Aprobado |
| `pnpm lint` | Aprobado |
| `pnpm test` | 5 archivos, 17 pruebas unitarias aprobadas |
| `pnpm test:storybook` | 7 archivos, 21 pruebas de stories aprobadas en Chromium |
| `pnpm build-storybook` | Build estático aprobado |
| `pnpm storybook:test:visual` | 1 baseline visual aprobada en Chromium/Linux |
| `CI=true pnpm storybook:test:visual` | Comparación aprobada contra Storybook estático |
| GitHub Actions run `30979332466` | Jobs `build` y `storybook` aprobados sobre `main` |
| GitHub Actions run `31065774017` | Canaria visual detectada; job `storybook` fallido de forma controlada |
| Artifact `storybook-visual-failure-31065774017-1` | `expected`, `actual`, `diff`, reporte HTML, trace y contexto publicados después del escaneo |
| `pnpm build` | Build de Next.js aprobado |
| `git diff --check` | Sin errores |

El spike confirmó los siguientes supuestos:

- Storybook 10 es compatible con el Node y gestor fijados actualmente;
- Next.js/Vite compila los imports y componentes presentacionales existentes;
- Chromium puede ejecutar las stories en el entorno Linux seleccionado;
- los estilos globales y tokens pueden compartirse con Production;
- las pruebas unitarias pueden permanecer aisladas de las pruebas de Storybook;
- y no es necesario adoptar Chromatic para obtener el catálogo y component tests iniciales.

Hallazgos y límites:

- Playwright requirió instalar dependencias Linux del navegador en Codespaces;
- Vitest/Vite emite una advertencia de configuración ESM cargada como CommonJS;
- la integración Next.js emite una advertencia por uso interno de `next/config`, deprecado hacia Next.js 16;
- `addon-a11y` detectó y bloqueó una violación canaria `button-name` con código de salida 1; después de añadir un nombre accesible, la misma story quedó aprobada;
- una story de `Button` incorpora una `play function` explícita que valida visibilidad, estado habilitado, interacción de clic y ejecución del callback;
- Playwright generó una baseline versionada para `Button Default — light` en Chromium/Linux;
- una modificación canaria de `Guardar` a `Guardar cambios` produjo código de salida 1, detectó 178 píxeles distintos y generó artifacts `expected`, `actual` y `diff` sin actualizar la baseline;
- GitHub Actions ejecuta en un job separado las pruebas de stories, el build estático y la comparación visual;
- CI valida que el comando de comparación no actualice snapshots;
- una ejecución normal sobre `main` aprobó los jobs `build` y `storybook`;
- el PR canario #38 produjo una regresión visual controlada y dejó `build` aprobado y `storybook` fallido;
- el escaneo de artifacts aprobó antes de la publicación;
- GitHub Actions publicó `expected`, `actual`, `diff`, reporte HTML, trace y contexto de error;
- el PR canario se cerró sin fusionarse y la baseline permaneció intacta;
- las decisiones del piloto sobre viewport, tolerancia, fonts, presupuesto de baselines, retención y adopción futura de Chromatic quedaron cerradas;
- y Product Owner, Diseño, Frontend, Accesibilidad, Calidad y Operación aprobaron formalmente la decisión.

Por lo tanto, la implementación demuestra viabilidad técnica de las fases 1, 2 y 3 y cumple los criterios de aceptación definidos. El ADR-0012 queda `Aceptado`.

---

## 80. Referencias

- [Arquitectura del Design System](../design-system-architecture.md)
- [Estrategia de pruebas](../testing-strategy.md)
- [Arquitectura de frontend](../frontend-architecture.md)
- [Arquitectura Mobile](../mobile-architecture.md)
- [Arquitectura Desktop](../desktop-architecture.md)
- [ADR-0007 — Pipeline CI/CD](0007-ci-cd-pipeline.md)
- [ADR-0011 — Formato canónico de tokens](0011-canonical-design-token-format.md)
- [Storybook 10 — Next.js with Vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)
- [Storybook — Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
- [Storybook — Accessibility testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- [Storybook — Interaction testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Storybook — Visual testing](https://storybook.js.org/docs/writing-tests/visual-testing)
- [Playwright — Visual comparisons](https://playwright.dev/docs/test-snapshots)

Las capacidades se verificaron el 2026-07-12 contra Storybook 10.5 y la documentación vigente de Playwright. Las versiones exactas se fijarán durante el piloto.

---

## 81. Resultado de la propuesta

La propuesta convierte las stories existentes en el inicio de una plataforma verificable, sin afirmar que hoy exista Storybook funcional.

Storybook documentará y probará estados aislados; Vitest y axe aportarán evidencia de comportamiento y accesibilidad; Playwright protegerá visuales seleccionados; y E2E seguirá comprobando la aplicación real.

---

## 82. Declaración final

> **CRUMAFOOD hará visible y ejecutable su lenguaje de interfaz: cada componente estable mostrará sus estados, demostrará su interacción y accesibilidad, y protegerá los cambios visuales importantes mediante baselines revisadas, no mediante capturas accidentales ni aprobaciones automáticas.**
