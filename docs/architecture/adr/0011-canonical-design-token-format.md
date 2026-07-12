# ADR-0011: Adoptar DTCG JSON como formato canónico de design tokens

> **Propuesta:** mantener los tokens fuente en JSON compatible con Design Tokens Community Group 2025.10 y generar de forma determinista variables CSS, tipos TypeScript y mappings de Tailwind para Web, Mobile y Desktop.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-07-12 |
| Decisores | Product Owner, responsable de diseño, responsable de frontend, responsable de accesibilidad y responsable de arquitectura |
| Consultados | Desarrollo Web, Mobile, Desktop, calidad, marca y responsables de componentes |
| Informados | Responsables de producto, soporte y usuarios del design system |
| Propietario | Design System, con corresponsabilidad de Frontend y Accesibilidad |
| Alcance | Formato fuente, capas, nombres, aliases, temas, generación, CSS, TypeScript, Tailwind, validación, versionado y migración |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica; requiere pipeline piloto antes de aceptación |
| Issues relacionados | Pendiente: token source, schema validation, generador, CSS, Tailwind mapping, temas, contraste y migración Mobile |

---

## 1. Resumen ejecutivo

CRUMAFOOD declara los design tokens como autoridad visual, pero hoy mantiene archivos TypeScript vacíos, CSS mínimo, `theme.extend` vacío y numerosos valores literales en páginas. No existe una representación primaria ni una generación reproducible.

La decisión propuesta es:

> **Los tokens fuente se expresarán en archivos JSON conformes al Design Tokens Format Module 2025.10 de DTCG. Los tokens se organizarán en base, semánticos y de componente; los temas sobrescribirán la capa semántica; y CSS, TypeScript y Tailwind serán artefactos generados que nunca se editarán manualmente.**

El formato DTCG es la autoridad; la herramienta de transformación será sustituible. Style Dictionary v4 es el candidato inicial para el piloto, no una dependencia aprobada por este texto.

---

## 2. Contexto

La plataforma incluye:

- Admin Web;
- Storefront;
- Mobile Web/PWA;
- Desktop con Tauri;
- Tailwind CSS 3;
- `next-themes`;
- componentes compartidos;
- y futuros consumidores independientes.

El lenguaje visual debe mantener semántica común sin obligar a cada runtime a consumir CSS ni duplicar valores.

---

## 3. Estado actual

Se identificó:

- `src/shared/design-system/tokens/` con archivos vacíos;
- `src/shared/design-system/styles/tokens.css` con variables mínimas;
- `src/app/globals.css` sin importar esa fuente;
- otro `globals.css` dentro del design system;
- Tailwind `theme.extend` vacío;
- light theme parcial;
- ausencia de paridad dark;
- primitives y variantes incompletas;
- y abundancia de colores Tailwind literales, especialmente en Mobile.

La arquitectura existe documentalmente, pero la cadena de autoridad todavía no funciona.

---

## 4. Problema

Sin formato canónico:

- CSS, TypeScript y Tailwind pueden divergir;
- Web y Desktop pueden interpretar valores distintos;
- los temas quedan incompletos;
- los aliases se copian manualmente;
- no se pueden validar referencias ni contraste de forma uniforme;
- y migrar herramientas exige reescribir la fuente visual.

La plataforma necesita una representación interoperable, tipada y generable.

---

## 5. Alcance

Esta decisión cubre:

- sintaxis canónica;
- estructura de archivos;
- capas de token;
- tipos;
- aliases;
- nombres;
- temas;
- generación;
- artefactos;
- CSS custom properties;
- integración Tailwind 3;
- TypeScript;
- Web/Mobile/Desktop;
- validación;
- versionado;
- deprecación;
- y migración.

No define:

- paleta final;
- espacio de color definitivo;
- tipografía de marca final;
- breakpoints definitivos;
- theming completo por tenant;
- Storybook;
- visual regression;
- ni publicación como paquete.

---

## 6. Definiciones

| Término | Definición |
|---|---|
| Token | Decisión de diseño nombrada y versionada |
| Base | Escala sin intención de producto |
| Semántico | Intención estable independiente del valor |
| Componente | Decisión específica reutilizable de un componente |
| Alias | Referencia de un token a otro token |
| Tema | Conjunto coherente de valores para las mismas claves semánticas |
| Source | Archivo editable que expresa la decisión |
| Artefacto | Salida generada para un runtime |
| DTCG | Design Tokens Community Group |

---

## 7. Fuerzas de decisión

| Fuerza | Importancia | Implicación |
|---|---|---|
| Una fuente de verdad | Crítica | Solo los archivos source se editan |
| Interoperabilidad | Alta | Formato no ligado a Tailwind o React |
| Multiplataforma | Crítica | CSS y TypeScript desde la misma fuente |
| Temas | Crítica | Claves semánticas estables entre modos |
| Accesibilidad | Crítica | Contraste, foco y motion verificables |
| Tipado | Alta | Consumidores TypeScript detectan nombres inválidos |
| Reproducibilidad | Crítica | Generación determinista y drift check |
| Gobernanza | Alta | Deprecación y changelog |
| Herramientas | Alta | Evitar formato propietario innecesario |
| Migración | Alta | Adoptar incrementalmente sin reescribir toda la UI |

---

## 8. Restricciones

La decisión deberá respetar:

- autoridad visual en `src/shared/design-system/tokens/`;
- Tailwind CSS 3 actualmente instalado;
- variables CSS para runtime y temas;
- light, dark y system como dirección;
- Mobile y Desktop compartiendo semántica;
- ningún paquete separado mientras exista un solo repositorio;
- accesibilidad desde la fuente;
- y generación sin secretos ni dependencias de negocio.

---

## 9. Supuestos

La propuesta asume que:

- JSON es consumible por diseño y desarrollo;
- el build puede ejecutar validación/generación;
- los artefactos pueden versionarse en Git;
- la primera migración conservará valores visuales cuando sea razonable;
- sRGB cubre el baseline inicial;
- y un futuro consumidor nativo podrá transformar la misma fuente.

Si un supuesto falla, este ADR se revisará.

---

## 10. Criterios de decisión

| Criterio | Prioridad | Evaluación |
|---|---|---|
| Interoperabilidad | Crítica | Soporte por herramientas y runtimes |
| Legibilidad | Alta | Revisión humana clara en Git |
| Tipos compuestos | Alta | Color, shadow, typography y gradient |
| Aliases | Crítica | Referencias sin duplicar valores |
| Temas | Crítica | Mismas claves con valores completos |
| Validación | Crítica | Schema, referencias y reglas propias |
| Generación | Crítica | CSS, TS y Tailwind deterministas |
| Lock-in | Alta | El formato sobrevive a la herramienta |
| Madurez | Alta | Especificación estable y versionable |

---

## 11. Opciones consideradas

| Opción | Resumen | Resultado |
|---|---|---|
| A | DTCG JSON como source | Elegida |
| B | TypeScript como source | No elegida |
| C | CSS custom properties como source | No elegida |
| D | Tailwind config como source | No elegida |
| E | Formato propietario de herramienta | No elegida |
| F | Mantener representaciones manuales | No elegida |

---

## 12. Opción A — DTCG JSON

Utiliza `$type`, `$value`, grupos, aliases y metadatos compatibles con DTCG.

Ventajas:

- formato interoperable;
- independencia de framework;
- tipos compuestos;
- revisión en Git;
- y soporte creciente de tooling.

Desventajas:

- requiere generador;
- valores compuestos son más verbosos;
- y la especificación es de W3C Community Group, no W3C Recommendation.

---

## 13. Opción B — TypeScript

Ofrece tipos y composición programática.

Se descarta como autoridad porque:

- obliga a ejecutar código para leer decisiones;
- acopla herramientas no JavaScript;
- facilita lógica arbitraria y no determinista;
- y dificulta intercambio con diseño.

TypeScript será salida generada.

---

## 14. Opción C — CSS

CSS custom properties son excelentes para runtime Web y theming.

Se descartan como source porque no expresan de forma portable todos los tipos, metadatos, aliases y salidas nativas.

CSS será artefacto generado.

---

## 15. Opción D — Tailwind config

Tailwind es un consumidor, no la autoridad visual multiplataforma.

Se descarta como source porque acopla nombres y valores al framework Web y no representa adecuadamente Mobile/Desktop futuros.

---

## 16. Opción E — Formato propietario

Un formato de Figma, Tokens Studio u otra herramienta puede ser útil como integración, pero no será autoridad sin un adapter explícito.

Se descarta para evitar lock-in y campos no portables.

---

## 17. Decisión propuesta

CRUMAFOOD adoptará:

1. DTCG JSON 2025.10 como formato source;
2. archivos con sufijo `.tokens.json`;
3. capas base, semantic y component;
4. temas con claves semánticas completas;
5. aliases DTCG;
6. `$extensions` solo para metadatos propios;
7. Style Dictionary v4 como candidato de transformación;
8. CSS, TypeScript y Tailwind generados;
9. artefactos generados versionados y verificados;
10. validación en CI;
11. migración incremental;
12. y espacio de color como decisión separada.

---

## 18. Autoridad

La jerarquía será:

```text
DTCG JSON source
  -> validación
  -> transformación determinista
  -> CSS / TypeScript / Tailwind
  -> primitives
  -> components
  -> patterns
  -> product surfaces
```

Una salida generada nunca corrige al source; el cambio vuelve al JSON.

---

## 19. Ubicación

La estructura objetivo será:

```text
src/shared/design-system/tokens/
  source/
    base/
    semantic/
    component/
    themes/
  generated/
    tokens.css
    tokens.ts
    tailwind-tokens.ts
  config/
    build-tokens.*
  README.md
```

La extensión exacta del script se decidirá durante el piloto según el gestor de paquetes y Node aprobados.

---

## 20. Archivos source

Los archivos source:

- terminarán en `.tokens.json`;
- usarán UTF-8;
- tendrán JSON válido sin comentarios;
- mantendrán orden estable por generación o convención;
- no contendrán secretos;
- y serán los únicos editables para valores.

La documentación explicativa vivirá en Markdown o `$description`.

---

## 21. Ejemplo DTCG

```json
{
  "color": {
    "palette": {
      "blue": {
        "700": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [0.06, 0.23, 0.45],
            "alpha": 1
          }
        }
      }
    },
    "action": {
      "primary": {
        "$type": "color",
        "$value": "{color.palette.blue.700}"
      }
    }
  }
}
```

Los valores reales se definirán mediante inventario y revisión visual; el ejemplo ilustra formato, no paleta aprobada.

---

## 22. Tipos permitidos

Se adoptarán tipos DTCG cuando apliquen:

- color;
- dimension;
- fontFamily;
- fontWeight;
- duration;
- cubicBezier;
- number;
- strokeStyle;
- border;
- transition;
- shadow;
- gradient;
- typography;
- y otros incorporados de forma compatible por la especificación.

Los tipos no soportados por un destino deberán fallar o tener transformación documentada, no convertirse silenciosamente.

---

## 23. `$type`

`$type` se declarará en el token o grupo más estrecho que mantenga claridad.

No se dependerá de inferencia por:

- nombre;
- unidad textual;
- valor hexadecimal;
- o carpeta.

Cambiar `$type` de un token existente será cambio incompatible.

---

## 24. `$value`

Todo token final tendrá `$value` válido para su tipo o alias válido.

No se guardarán expresiones JavaScript, funciones, variables de entorno ni valores calculados en runtime dentro del source.

Los cálculos necesarios se materializarán o se implementarán como transformación versionada y probada.

---

## 25. Aliases

Los aliases usarán la sintaxis DTCG:

```json
{
  "surface": {
    "default": {
      "$type": "color",
      "$value": "{color.neutral.0}"
    }
  }
}
```

Se prohibirán:

- ciclos;
- referencias ausentes;
- referencias entre tipos incompatibles;
- y cadenas excesivas que oculten intención.

---

## 26. `$description`

Los tokens semánticos y de componente relevantes incluirán `$description` cuando el nombre no capture:

- propósito;
- superficies autorizadas;
- restricciones de contraste;
- estado;
- o motivo de deprecación.

La descripción no repetirá solo el nombre.

---

## 27. `$extensions`

Los metadatos propios vivirán bajo un namespace estable, por ejemplo:

```json
{
  "$extensions": {
    "com.cruma.design": {
      "status": "stable",
      "deprecated": false,
      "owner": "design-system"
    }
  }
}
```

No se añadirán propiedades propietarias al nivel raíz de un token fuera de `$extensions`.

---

## 28. Capas

Las capas serán:

1. **base:** escalas y valores primitivos;
2. **semantic:** intención de interfaz;
3. **component:** decisiones específicas reutilizables;
4. **theme:** resolución alternativa de tokens semánticos;
5. **generated:** salidas, nunca fuente.

Una superficie de producto consumirá semantic o component, no base salvo excepción documentada.

---

## 29. Tokens base

Ejemplos:

- `color.palette.neutral.0`;
- `space.scale.4`;
- `radius.scale.md`;
- `font.size.300`;
- `motion.duration.fast`;
- y `shadow.scale.2`.

Los nombres de base pueden describir escala o familia, no intención de negocio.

---

## 30. Tokens semánticos

Ejemplos:

- `color.surface.default`;
- `color.text.muted`;
- `color.border.strong`;
- `color.action.primary.default`;
- `color.feedback.danger.background`;
- `focus.ring.color`;
- y `space.layout.section`.

Los nombres permanecerán estables al cambiar tema o marca.

---

## 31. Tokens de componente

Se crearán solo cuando:

- el componente sea reutilizable;
- semantic no exprese la necesidad;
- el valor deba cambiar coordinadamente;
- y exista propietario.

Ejemplos:

- `component.button.height.md`;
- `component.sidebar.width.expanded`;
- `component.table.row.height.compact`.

No se crearán tokens por página o instancia.

---

## 32. Nomenclatura

Los paths usarán:

- minúsculas ASCII;
- palabras semánticas en inglés técnico consistente;
- segmentos separados por punto en DTCG;
- sin valores literales en nombres semánticos;
- y sin abreviaturas ambiguas.

La salida CSS convertirá puntos a guiones.

---

## 33. Nombres prohibidos

Se evitarán nombres como:

- `blueButton`;
- `gray500Text`;
- `mobileCard2`;
- `newPrimary`;
- `tempSpacing`;
- `adminRed`;
- y `magic12`.

El nombre debe sobrevivir a un cambio de valor y explicar intención.

---

## 34. Espacio de color

El formato DTCG permite expresar el espacio de color explícitamente.

La migración inicial usará **sRGB** para conservar compatibilidad y valores existentes.

OKLCH, Display P3 u otro espacio requerirá spike separado que evalúe:

- soporte de navegador/WebView;
- gamut mapping;
- contraste;
- tooling;
- degradación;
- y paridad de screenshots.

---

## 35. Dimensiones

Spacing, tamaños, radios y otras dimensiones incluirán valor y unidad compatibles con DTCG.

Se preferirá:

- `rem` para tipografía y spacing escalable en Web;
- `px` cuando represente borde o requisito físico de render;
- y adaptadores por plataforma para unidades nativas.

No se mezclarán números unitless y dimensiones por conveniencia.

---

## 36. Tipografía

Los tokens cubrirán:

- font family;
- weight;
- size;
- line height;
- letter spacing;
- y composiciones tipográficas.

Las fuentes y fallbacks se decidirán por separado, pero su uso se expresará mediante tokens.

---

## 37. Motion

Motion incluirá:

- duración;
- easing;
- transición;
- y alternativas de reduced motion.

La salida respetará `prefers-reduced-motion`.

No se convertirá una animación esencial en requisito para comprender el estado.

---

## 38. Sombras y compuestos

Shadows, borders, transitions, gradients y typography usarán tipos compuestos DTCG cuando sea viable.

Los destinos que no soporten un compuesto completo deberán:

- transformarlo explícitamente;
- emitir diagnóstico;
- y tener prueba visual.

No se aplanará información silenciosamente.

---

## 39. Breakpoints

Los breakpoints podrán expresarse como tokens base para compartir nombres y documentación.

No se asumirán iguales entre:

- layout Web;
- WebView Desktop;
- Mobile;
- y futuros clientes nativos.

Su valor definitivo permanece pendiente de evidencia de contenido y dispositivos.

---

## 40. Z-index

Z-index se expresará como una escala semántica limitada:

- base;
- sticky;
- dropdown;
- overlay;
- modal;
- toast;
- y critical overlay cuando exista.

No se generarán tokens para competir con un valor arbitrario mayor.

---

## 41. Temas

Cada tema resolverá las mismas claves semánticas requeridas.

Temas iniciales:

- light;
- dark;
- y system como selección de light/dark, no tercer set independiente.

Un tema incompleto fallará validación.

---

## 42. Estructura de temas

Los temas podrán mantener archivos separados:

```text
source/themes/light.tokens.json
source/themes/dark.tokens.json
```

Ambos deberán contener o resolver el contrato semántico completo.

Los tokens base compartidos no se duplicarán en cada tema.

---

## 43. Tema por tenant

Este ADR no aprueba theming libre por tenant.

Una futura implementación solo podrá sobrescribir una allowlist, por ejemplo:

- logo;
- brand accent validado;
- y assets permitidos.

No podrá cambiar:

- danger;
- focus;
- contraste mínimo;
- tamaños táctiles;
- ni semántica de estados.

---

## 44. Salida CSS

El generador producirá custom properties con nombres estables:

```css
:root,
[data-theme='light'] {
  --cruma-color-surface-default: ...;
  --cruma-color-text-default: ...;
}

[data-theme='dark'] {
  --cruma-color-surface-default: ...;
  --cruma-color-text-default: ...;
}
```

El prefijo `--cruma-` evitará colisiones.

---

## 45. CSS como runtime

Web, Mobile Web y Desktop WebView consumirán variables CSS.

Las variables permitirán:

- cambio de tema sin recompilar componentes;
- herencia controlada;
- inspección en navegador;
- y mapeo desde Tailwind.

Los componentes no redefinirán variables globales salvo contrato explícito de scope.

---

## 46. Tailwind CSS 3

Mientras el proyecto use Tailwind 3, `tailwind.config.ts` importará un mapping generado o mapeará explícitamente variables generadas.

Ejemplo conceptual:

```ts
colors: {
  background: 'var(--cruma-color-surface-default)',
  foreground: 'var(--cruma-color-text-default)',
  primary: 'var(--cruma-color-action-primary-default)',
}
```

Tailwind no almacenará valores fuente duplicados.

---

## 47. Utilities semánticas

La integración habilitará utilities como:

- `bg-background`;
- `text-foreground`;
- `border-border`;
- `bg-primary`;
- `text-danger`;
- `ring-focus`;
- y `rounded-control`.

Los colores literales `bg-blue-600` o `text-gray-500` se migrarán progresivamente fuera de superficies de producto.

---

## 48. Salida TypeScript

La generación producirá:

- nombres de token tipados;
- objetos readonly para consumidores no CSS;
- metadata mínima cuando sea útil;
- y, si procede, helpers de resolución.

Ejemplo conceptual:

```ts
export type SemanticColorToken =
  | 'color.surface.default'
  | 'color.text.default'
  | 'color.action.primary.default';
```

El archivo no se editará manualmente.

---

## 49. Consumidores nativos futuros

Si Mobile o Desktop adoptan UI nativa, se generarán artefactos específicos desde el mismo DTCG source:

- Swift;
- Kotlin;
- Rust;
- u otro formato requerido.

La transformación respetará semántica aunque unidades o representación cambien.

No se copiarán valores manualmente a otro repositorio.

---

## 50. Generador

Style Dictionary v4 será el candidato inicial porque declara soporte de primera clase para DTCG.

El piloto evaluará:

- conformidad real;
- transform groups;
- tipos compuestos;
- temas;
- formato de salida;
- velocidad;
- mantenimiento;
- y tamaño de dependencia.

Si falla, se reemplazará sin cambiar el source.

---

## 51. Generación determinista

La generación deberá producir bytes equivalentes con:

- mismo source;
- misma versión de herramienta;
- misma configuración;
- y mismo runtime.

Se fijarán versiones y lockfile.

No se incluirán timestamps variables, rutas locales o orden no determinista en artefactos.

---

## 52. Artefactos versionados

Los artefactos generados se confirmarán en Git inicialmente para:

- revisar cambios;
- permitir consumo inmediato;
- detectar impacto;
- y no depender de generación implícita en cada editor.

Cada archivo incluirá encabezado de “generado; no editar”.

CI regenerará y fallará si existe drift.

---

## 53. Pipeline

El flujo será:

```text
parse -> schema -> references -> custom rules -> transform -> format -> tests -> drift check
```

Un token inválido no llegará a Tailwind o Production.

La generación será un script canónico después de decidir gestor de paquetes y versión de Node.

---

## 54. Schema validation

Se validará:

- JSON;
- propiedades DTCG;
- `$type`;
- `$value`;
- tipos compuestos;
- referencias;
- aliases circulares;
- y extensiones propias.

Una herramienta tolerante no convertirá un error en warning silencioso.

---

## 55. Reglas propias

Además del formato se verificará:

- nombres canónicos;
- capas permitidas;
- semantic sin valor literal prohibido cuando deba usar alias;
- paridad de temas;
- component token con propietario;
- deprecaciones;
- duplicados;
- unidades;
- contraste;
- y valores fuera de escala.

---

## 56. Contraste

Las combinaciones semánticas declararán pares verificables:

- background/foreground;
- action/foreground;
- feedback/foreground;
- border/surface;
- y focus/adjacent colors.

CI calculará contraste conforme al criterio de accesibilidad adoptado.

Cambiar un color base deberá volver a validar todos sus aliases.

---

## 57. Temas completos

CI comparará claves semánticas entre light y dark.

Fallará cuando:

- falte token;
- cambie tipo;
- exista alias roto;
- el fallback oculte ausencia;
- o una combinación no alcance contraste requerido.

System resolverá uno de los temas completos.

---

## 58. Lint visual

La migración introducirá reglas para detectar:

- hex directos;
- `rgb()`/`hsl()` directos;
- colores Tailwind literales;
- spacing arbitrario;
- radios arbitrarios;
- z-index arbitrario;
- y shadows literales.

Una allowlist temporal tendrá archivo, línea o patrón, propietario y fecha de eliminación.

---

## 59. Excepciones

Una excepción deberá registrar:

- motivo;
- valor;
- superficie;
- duración;
- propietario;
- riesgo;
- y plan de convergencia.

No se creará un token global para legitimar un valor usado una sola vez sin intención reusable.

---

## 60. Versionado

Los cambios se clasificarán:

- **patch:** corrección compatible de metadata o valor sin cambiar intención pública;
- **minor:** token aditivo o nueva salida compatible;
- **major:** eliminación, rename, cambio de tipo o semántica incompatible.

Mientras no exista paquete, la clasificación se conservará en changelog y releases del repositorio.

---

## 61. Deprecación

Un token deprecado:

- permanece resoluble durante una ventana;
- incluye reemplazo;
- emite warning en validación;
- aparece en changelog;
- y tiene fecha objetivo de retiro.

No se reciclará el mismo nombre para otra intención.

---

## 62. Changelog

Cada cambio material registrará:

- token;
- capa;
- valor anterior y nuevo cuando sea seguro;
- motivo;
- impacto;
- temas;
- componentes afectados;
- migración;
- evidencia visual;
- y fecha.

---

## 63. Seguridad

Los tokens no contendrán:

- secretos;
- URLs firmadas;
- identificadores de tenant;
- datos personales;
- feature flags de autorización;
- ni configuración sensible.

Un color o tema nunca concederá permisos ni ocultará una acción prohibida como control de seguridad.

---

## 64. Rendimiento

Se medirá:

- tamaño de CSS generado;
- variables duplicadas;
- tiempo de generación;
- impacto de temas;
- Tailwind output;
- y costo de runtime al cambiar tema.

No se emitirán todos los tokens a todos los destinos si el consumidor no los necesita y el filtrado conserva el contrato.

---

## 65. Web

Web consumirá:

- `tokens.css` generado;
- mapping de Tailwind generado;
- TypeScript para APIs de componentes cuando aplique;
- y primitives semánticas.

Existirá un único entrypoint global que importe tokens en orden explícito.

---

## 66. Mobile

Mobile Web consumirá la misma salida CSS y Tailwind, adaptando layout y densidad.

La primera migración priorizará:

- estados;
- fondos;
- texto;
- botones;
- inputs;
- progreso;
- y feedback actualmente hardcodeados.

No se intentará reemplazar toda clase literal en un solo PR.

---

## 67. Desktop

Desktop WebView consumirá los mismos tokens semánticos.

Podrá añadir tokens de componente para:

- densidad;
- hardware;
- ventanas;
- impresión;
- y affordances de escritorio.

No duplicará la paleta ni reinterpretará danger, success o focus.

---

## 68. Pruebas

Se cubrirá:

- parse;
- schema;
- aliases;
- ciclos;
- tipos;
- generación determinista;
- drift;
- temas;
- contraste;
- CSS syntax;
- TypeScript compile;
- Tailwind utilities;
- y snapshots de salidas seleccionadas.

---

## 69. CI/CD

ADR-0007 incorporará jobs para:

1. validar source;
2. generar en directorio limpio;
3. ejecutar reglas propias;
4. compilar artefactos;
5. comparar con Git;
6. probar contraste;
7. y reportar impacto.

Un drift fallará el Pull Request.

---

## 70. Migración

La migración será incremental:

### Fase 0 — Inventario

- extraer valores usados;
- agrupar equivalencias;
- identificar estados;
- y definir owners.

### Fase 1 — Source y pipeline

- crear DTCG base;
- crear semantic light;
- configurar generador;
- y validar CSS/TS/Tailwind.

### Fase 2 — Cadena Web

- consolidar globals;
- importar CSS generado;
- mapear Tailwind;
- y migrar primitives.

### Fase 3 — Temas

- completar dark;
- verificar contraste;
- y probar system.

### Fase 4 — Superficies

- migrar Admin;
- luego Storefront;
- luego Mobile;
- y después Desktop específico.

---

## 71. Estrategia de compatibilidad

Durante migración podrán existir aliases temporales desde nombres antiguos hacia nuevos.

Se evitará:

- doble source;
- editar CSS generado;
- mezclar token nuevo con literal equivalente indefinidamente;
- y cambiar apariencia funcional sin revisión visual.

Cada fase tendrá allowlist decreciente.

---

## 72. Piloto

El piloto cubrirá un vertical slice pequeño:

- paleta neutral base;
- primary;
- surface/background/foreground;
- success/warning/danger;
- spacing esencial;
- radius;
- Button;
- Input;
- Card;
- y una pantalla Mobile con estados.

Deberá demostrar light/dark, Tailwind, TypeScript, contraste y drift check.

---

## 73. Consecuencias positivas

- una fuente de verdad real;
- interoperabilidad;
- salidas multiplataforma;
- temas completos;
- tipos y aliases verificables;
- menor acoplamiento a Tailwind;
- cambios revisables;
- y migración futura a otras herramientas sin reescribir valores.

---

## 74. Consecuencias negativas

- pipeline y dependencia de generación;
- JSON más verboso;
- artefactos generados en Git;
- aprendizaje de DTCG;
- trabajo para migrar literales;
- necesidad de gobernar aliases y deprecaciones;
- y posible brecha entre soporte de especificación y herramientas.

---

## 75. Riesgos y controles

| Riesgo | Control |
|---|---|
| Herramienta no soporta tipo | Spike, tests y adapter |
| Source y outputs divergen | Generación determinista y drift CI |
| Tema incompleto | Paridad obligatoria |
| Alias circular | Validación de grafo |
| Proliferación de tokens | Criterios por capa y owner |
| Nombre pierde semántica | Revisión y naming rules |
| Contraste roto por alias | Pruebas transitivas |
| Mobile queda sin migrar | Vertical slice y fases |
| DTCG cambia | Versión fijada y trigger de revisión |
| Tailwind se vuelve autoridad | Mapping generado sin valores duplicados |

---

## 76. Plan de implementación

1. conservar este ADR como Propuesto;
2. inventariar valores actuales;
3. crear spike DTCG mínimo;
4. evaluar Style Dictionary v4;
5. generar CSS/TS/Tailwind;
6. integrar sin cambiar toda la UI;
7. migrar primitives piloto;
8. probar light/dark y contraste;
9. añadir CI;
10. medir impacto;
11. documentar migración;
12. y solicitar aceptación.

No se instalará herramienta ni modificará UI como parte de este ADR documental.

---

## 77. Criterios para Aceptado

Este ADR podrá pasar a Aceptado cuando:

- exista source DTCG válido;
- el generador esté fijado y documentado;
- CSS, TypeScript y Tailwind se generen determinísticamente;
- CI detecte drift;
- light y dark tengan paridad piloto;
- contraste esté verificado;
- un Button, Input y Card consuman tokens;
- una pantalla Mobile elimine literales seleccionados;
- outputs no se editen manualmente;
- y Diseño, Frontend, Accesibilidad y Arquitectura aprueben la evidencia.

---

## 78. Preguntas abiertas

Antes de Aceptado se resolverá:

- ¿Style Dictionary v4 cubre todos los tipos necesarios?;
- ¿qué gestor de paquetes y Node ejecutarán generación?;
- ¿qué valores actuales se conservan en el baseline?;
- ¿qué fuente tipográfica se adopta?;
- ¿qué espacio de color sigue después de sRGB?;
- ¿qué criterio de contraste exacto se automatiza?;
- ¿qué subset requiere cada destino?;
- ¿qué nombres semánticos forman el contrato v1?;
- ¿qué allowlist de branding por tenant será segura?;
- y ¿cuánto tiempo vivirán aliases deprecados?

---

## 79. Métricas de la decisión

Se seguirá:

- tokens válidos;
- aliases rotos;
- drift incidents;
- paridad de temas;
- combinaciones de contraste conformes;
- valores literales restantes;
- porcentaje de primitives tokenizadas;
- pantallas migradas;
- tamaño de CSS;
- tiempo de generación;
- y cambios visuales no intencionales.

---

## 80. Triggers de revisión

Este ADR se revisará cuando:

- DTCG publique revisión incompatible;
- Style Dictionary no cubra necesidades;
- cambie Tailwind mayor;
- se adopte UI nativa;
- se publique paquete independiente;
- se implemente theming por tenant;
- cambie espacio de color;
- ocurra incidente de accesibilidad;
- o los artefactos generados resulten insostenibles.

---

## 81. Registro de aprobación

| Rol | Estado | Evidencia |
|---|---|---|
| Product Owner | Pendiente | Identidad y prioridad |
| Diseño | Pendiente | Taxonomía y valores piloto |
| Frontend | Pendiente | Generación e integración |
| Accesibilidad | Pendiente | Contraste, foco y motion |
| Arquitectura | Pendiente | Interoperabilidad y gobierno |
| Mobile/Desktop | Pendiente | Consumo multiplataforma |

El texto no equivale a aprobación.

---

## 82. Historial

| Fecha | Cambio |
|---|---|
| 2026-07-12 | Creación de la propuesta ADR-0011 |

---

## 83. Referencias

- [Arquitectura del Design System](../design-system-architecture.md)
- [Arquitectura de frontend](../frontend-architecture.md)
- [Arquitectura Mobile](../mobile-architecture.md)
- [Arquitectura Desktop](../desktop-architecture.md)
- [Estrategia de pruebas](../testing-strategy.md)
- [DTCG — Design Tokens Format Module 2025.10](https://www.designtokens.org/TR/2025.10/format/)
- [W3C Community Group — Primera versión estable](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [Style Dictionary — DTCG](https://styledictionary.com/info/dtcg/)
- [Tailwind CSS v3 — Customizing Colors](https://v3.tailwindcss.com/docs/customizing-colors)

La especificación se verificó el 2026-07-12. DTCG es una especificación estable de Community Group y no una W3C Recommendation.

---

## 84. Resultado de la propuesta

La propuesta cierra la ambigüedad entre TypeScript, CSS y Tailwind.

DTCG JSON será la decisión editable; los runtimes recibirán salidas adecuadas; los temas compartirán contrato; y la plataforma podrá evolucionar herramientas sin convertirlas en autoridad visual.

---

## 85. Declaración final

> **CRUMAFOOD expresará una vez cada decisión visual, la validará como dato interoperable y generará sus representaciones de plataforma, evitando que CSS, Tailwind, TypeScript o una herramienta de diseño se conviertan en fuentes divergentes.**
