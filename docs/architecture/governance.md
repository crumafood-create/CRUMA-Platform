# Gobierno de Arquitectura de CRUMAFOOD Platform

> **Las decisiones importantes deben ser explícitas, revisables, trazables y modificables mediante un proceso responsable.**

## Estado del documento

| Campo | Valor |
|---|---|
| Estado | Aprobado |
| Versión | 1.0 |
| Propietarios | Product Owner y responsable de Arquitectura |
| Aprobado por | Product Owner de CRUMAFOOD Platform |
| Fecha de aprobación | 2026-07-18 |
| Alcance | Estados, autoridad, ADR, RFC, revisión, excepciones y conformidad |
| Autoridad | Engineering Operating System y documentación arquitectónica aprobada |
| Revisión | Semestralmente o cuando cambie el proceso de gobierno |

---

## 1. Propósito

Este documento define cómo se gobierna la arquitectura de CRUMAFOOD Platform: autoridad, estados, revisiones, ADR, RFC, contradicciones, excepciones y conformidad.

## 2. Principios

- Las decisiones importantes deben quedar explícitas.
- Cada regla debe tener una fuente principal.
- Las decisiones reemplazadas conservan su historia.
- El rigor debe ser proporcional al impacto y reversibilidad.
- La documentación debe cambiar junto con el sistema.
- Las excepciones deben ser visibles y revisables.

## 3. Estados documentales

### Borrador

Documento incompleto y no vinculante.

### Propuesto

Documento listo para revisión, todavía sin autoridad definitiva.

### Aprobado

Referencia vigente.

### Reemplazado

Sustituido por otra referencia; debe enlazar a su reemplazo.

### Obsoleto

Conservado únicamente por valor histórico.

### Rechazado

Propuesta evaluada y no aceptada.

## 4. Transiciones

```text
Borrador ──► Propuesto ──► Aprobado
                 │             │
                 └──► Rechazado
                               │
                               └──► Reemplazado / Obsoleto
```

Toda transición deberá quedar registrada mediante commit o Pull Request.

## 5. Jerarquía de autoridad

1. CES Constitution;
2. Engineering Principles;
3. ADR aceptado y específico;
4. arquitectura especializada aprobada;
5. arquitectura general;
6. documentación de módulo;
7. guías y runbooks;
8. ejemplos;
9. código existente.

Una fuente inferior no puede cambiar una superior por sí sola.

## 6. Contradicciones

Ante una contradicción:

1. identificar las fuentes;
2. comparar autoridad, especificidad y vigencia;
3. revisar ADR relacionados;
4. determinar si existe error documental o cambio arquitectónico;
5. actualizar referencias;
6. registrar la resolución.

## 7. Tipos de documento

| Tipo | Propósito |
|---|---|
| Arquitectura | Define límites, responsabilidades y propiedades duraderas |
| ADR | Registra una decisión específica y sus consecuencias |
| RFC | Propone un cambio que necesita discusión |
| Documento de módulo | Explica lenguaje, ownership, casos de uso y contratos |
| Guía | Explica cómo ejecutar una práctica aprobada |
| Runbook | Describe respuesta operativa |
| Decision Log | Preserva evolución y contexto |

## 8. Cuándo crear un ADR

Un ADR es obligatorio cuando una decisión:

- afecta varios módulos;
- cambia ownership;
- introduce o sustituye un proveedor principal;
- cambia persistencia o seguridad;
- crea una nueva frontera;
- agrega comunicación asíncrona;
- adopta offline, Tauri o hardware;
- afecta disponibilidad o recuperación;
- es costosa de revertir.

## 9. Estructura ADR objetivo

```markdown
# ADR-NNNN: Título

## Estado
## Contexto
## Fuerzas de decisión
## Opciones consideradas
## Decisión
## Consecuencias
## Riesgos
## Plan de adopción
## Plan de reversión
## Evidencia
## Referencias
```

## 10. Estados ADR

| Estado | Significado |
|---|---|
| Propuesto | En revisión |
| Aceptado | Decisión vigente |
| Rechazado | No adoptado |
| Reemplazado | Sustituido |
| Obsoleto | Ya no aplicable |

Un ADR aceptado no se edita para ocultar la decisión original. Se crea un nuevo ADR que lo reemplaza.

## 11. RFC

Un RFC se utilizará cuando:

- exista incertidumbre material;
- varios módulos estén afectados;
- sea necesaria experimentación;
- la propuesta todavía no tenga decisión;
- se requiera retroalimentación.

Un RFC no tiene autoridad hasta producir una decisión aceptada.

## 12. Ownership

Cada documento deberá indicar:

- propietario principal;
- revisores esperados;
- fecha o condición de revisión;
- documentos dependientes.

Ownership significa responsabilidad de mantener coherencia, no control exclusivo.

## 13. Revisión

Un documento deberá revisarse cuando:

- cambia una dependencia principal;
- aparece una contradicción;
- ocurre un incidente relevante;
- se incorpora un nuevo cliente;
- cambia un límite;
- se reemplaza un proveedor;
- una métrica invalida una suposición.

## 14. Tipos de cambio

### Editorial

Claridad, ortografía o enlaces. No cambia la decisión.

### Compatible

Agrega detalle sin cambiar la dirección.

### Arquitectónico

Cambia responsabilidad, límite, contrato, proveedor o propiedad. Requiere revisión reforzada y posiblemente ADR.

## 15. Pull Requests

Un Pull Request documental deberá explicar:

- problema;
- cambio;
- autoridad afectada;
- documentos relacionados;
- riesgos;
- verificación;
- decisión requerida.

Los cambios arquitectónicos no deberán ocultarse dentro de PR de implementación.

## 16. Convención de nombres

- `kebab-case.md`;
- nombres descriptivos;
- ADR con identificador secuencial;
- evitar `final`, `new` y `v2` en nombres permanentes.

## 17. Plantilla arquitectónica

```markdown
# Título

## Estado del documento
## Propósito
## Alcance
## Contexto
## Estado actual
## Estado objetivo
## Principios
## Componentes o decisiones
## Riesgos
## Decisiones pendientes
## Conformidad
## Evolución
## Declaración final
```

## 18. Lenguaje normativo

- **debe**: obligatorio;
- **no debe**: prohibido;
- **debería**: recomendado;
- **puede**: permitido.

La documentación deberá distinguir claramente entre estado actual, estado objetivo y propuesta.

## 19. Excepciones

Una excepción deberá documentar:

- regla afectada;
- motivo;
- alcance;
- responsable;
- riesgo;
- mitigación;
- fecha de revisión;
- condición de cierre.

## 20. Riesgos documentales

- documentos duplicados;
- referencias sin propietario;
- estados no declarados;
- arquitectura desalineada con el sistema;
- ejemplos tratados como reglas;
- decisiones únicamente en conversaciones;
- documentos demasiado extensos;
- enlaces rotos;
- lenguaje contradictorio.

## 21. Automatización objetivo

La plataforma deberá avanzar hacia:

- validación de enlaces;
- lint de Markdown;
- verificación de estado;
- catálogo automático;
- detección de documentos sin referencia;
- validación básica de ADR;
- validación de diagramas cuando sea viable.

## 22. Criterios de conformidad

Un documento es conforme cuando:

- tiene título y propósito;
- declara estado;
- tiene propietario;
- enlaza fuentes;
- no contradice autoridad superior;
- distingue actual y objetivo;
- contiene decisiones verificables;
- evita duplicación innecesaria;
- está referenciado;
- pasa validaciones.

## 23. Revisión periódica

Se recomienda una revisión trimestral ligera y una revisión semestral formal para identificar:

- documentos obsoletos;
- propietarios faltantes;
- contradicciones;
- ADR pendientes;
- decisiones implementadas sin documentación;
- enlaces rotos;
- riesgos emergentes.

## 24. Declaración final

> **El gobierno de arquitectura existe para mantener coherencia sin impedir evolución.**

CRUMAFOOD Platform deberá poder cambiar de tecnología, estructura y escala sin perder contexto, autoridad, trazabilidad, responsabilidad ni capacidad de aprendizaje.
