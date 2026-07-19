# Arquitectura de CRUMAFOOD Platform

> **Mapa oficial de la arquitectura, sus documentos, su autoridad y sus rutas de lectura.**

## Estado del documento

| Campo | Valor |
|---|---|
| Estado | sprobado |
| Versión | 2.0 |
| Propietarios | Product Owner y responsable de Arquitectura |
| Aprobado por | Product Owner de CRUMAFOOD Platform |
| Fecha de aprobación | 2026-07-18 |
| Alcance | Índice oficial de `docs/architecture/` |
| Autoridad | Constitución, Principios y Engineering Operating System del CES |
| Revisión | Cuando cambie el catálogo o el estado de un documento |

---

## 1. Propósito

Este directorio contiene las decisiones, límites, modelos y criterios que orientan la evolución técnica de **CRUMAFOOD Platform**.

Este `README.md` funciona como índice oficial, mapa de navegación y punto de entrada para nuevos participantes. No sustituye los documentos especializados: indica qué documento consultar y cuál tiene autoridad sobre cada tema.

## 2. Jerarquía documental

```text
Product Vision
      │
CES Constitution
      │
Engineering Principles
      │
Engineering Operating System
      │
Architecture Documentation
      │
ADR y RFC
      │
Documentación de módulos
      │
Código, esquema e infraestructura
```

Una capa inferior no deberá contradecir una capa superior sin una decisión explícita.

## 3. Documentos fundamentales

Antes de consultar una arquitectura especializada, se recomienda leer:

1. [`../vision.md`](../vision.md)
2. [`../engineering/constitution.md`](../engineering/constitution.md)
3. [`../engineering/engineering-principles.md`](../engineering/engineering-principles.md)
4. [`../engineering/engineering-operating-system.md`](../engineering/engineering-operating-system.md)
5. [`system-overview.md`](system-overview.md)

## 4. Catálogo arquitectónico

| Documento | Responsabilidad principal |
|---|---|
| [`system-overview.md`](system-overview.md) | Contexto, productos, capas, módulos y dirección general |
| [`business-core.md`](business-core.md) | Dominio, aplicación, límites modulares y contratos |
| [`data-architecture.md`](data-architecture.md) | Persistencia, integridad, ownership, inventario, migraciones y recuperación |
| [`security-architecture.md`](security-architecture.md) | Identidad, autorización, amenazas, protección e incidentes |
| [`integration-architecture.md`](integration-architecture.md) | APIs, eventos, webhooks, proveedores y contratos externos |
| [`deployment-architecture.md`](deployment-architecture.md) | Entornos, CI/CD, despliegue, configuración y rollback |
| [`frontend-architecture.md`](frontend-architecture.md) | Arquitectura web y composición con Next.js |
| [`desktop-architecture.md`](desktop-architecture.md) | Tauri, capacidades nativas, distribución y actualizaciones |
| [`mobile-architecture.md`](mobile-architecture.md) | Operación móvil, sincronización y restricciones del cliente |
| [`multi-tenancy-architecture.md`](multi-tenancy-architecture.md) | Organizaciones, aislamiento, alcance y tenancy |
| [`observability-architecture.md`](observability-architecture.md) | Logs, métricas, trazas, alertas y diagnóstico |
| [`performance-architecture.md`](performance-architecture.md) | Medición, capacidad, consultas, caching y presupuestos |
| [`design-system-architecture.md`](design-system-architecture.md) | Tokens, componentes, accesibilidad y consistencia visual |
| [`testing-strategy.md`](testing-strategy.md) | Estrategia de pruebas por capa, riesgo y flujo |
| [`governance.md`](governance.md) | Estados, autoridad, ADR, RFC, revisión y conformidad |

## 5. Orden de lectura recomendado

### Fundamentos

1. `system-overview.md`
2. `business-core.md`
3. `data-architecture.md`
4. `security-architecture.md`

### Clientes

1. `frontend-architecture.md`
2. `desktop-architecture.md`
3. `mobile-architecture.md`
4. `design-system-architecture.md`

### Plataforma y operación

1. `integration-architecture.md`
2. `deployment-architecture.md`
3. `observability-architecture.md`
4. `performance-architecture.md`
5. `testing-strategy.md`

### Gobierno

1. `governance.md`
2. `adr/`
3. RFC vigentes

## 6. Rutas de lectura por tipo de trabajo

### Desarrollo de negocio

`system-overview.md` → `business-core.md` → `data-architecture.md` → `security-architecture.md` → ADR aplicables.

### Frontend

`frontend-architecture.md` → `design-system-architecture.md` → `security-architecture.md` → `testing-strategy.md`.

### Desktop

`desktop-architecture.md` → `security-architecture.md` → `integration-architecture.md` → `deployment-architecture.md`.

### Mobile

`mobile-architecture.md` → `security-architecture.md` → `integration-architecture.md` → `data-architecture.md`.

### Datos y backend

`business-core.md` → `data-architecture.md` → `multi-tenancy-architecture.md` → `security-architecture.md` → `performance-architecture.md`.

### Operación y confiabilidad

`deployment-architecture.md` → `observability-architecture.md` → `performance-architecture.md` → `security-architecture.md`.

## 7. Estados documentales

| Estado | Significado |
|---|---|
| Borrador | Incompleto y no vinculante |
| Propuesto | Listo para revisión |
| Aprobado | Referencia vigente |
| Reemplazado | Sustituido por otro documento |
| Obsoleto | Conservado solo como historia |
| Rechazado | Evaluado y no aceptado |

Las reglas completas están en [`governance.md`](governance.md).

## 8. Autoridad

Cuando dos documentos parezcan contradecirse, se aplicará este orden:

1. Constitución del CES;
2. Engineering Principles;
3. ADR aceptado más específico;
4. arquitectura especializada aprobada;
5. `system-overview.md`;
6. documentación de módulo;
7. guías y ejemplos;
8. código existente.

El código existente demuestra el estado actual, pero no siempre representa el estado objetivo.

## 9. ADR y RFC

Los ADR viven en:

```text
docs/architecture/adr/
```

Se requiere ADR cuando una decisión cambia límites, ownership, persistencia, seguridad, proveedor principal, Desktop, Mobile, offline, eventos o una capacidad costosa de revertir.

Un RFC se utiliza cuando todavía existe incertidumbre material y se necesita discusión antes de decidir.

## 10. Mantenimiento

Cada documento deberá:

- declarar estado y propietario;
- separar estado actual de estado objetivo;
- enlazar sus fuentes relacionadas;
- evitar duplicar autoridad;
- actualizarse junto al cambio correspondiente;
- permanecer referenciado desde este índice.

## 11. Validaciones rápidas

Listar documentos:

```bash
find docs/architecture -maxdepth 1 -type f -name '*.md' -printf '%f\n' | sort
```

Revisar formato:

```bash
git diff --check
```

Revisar enlaces y documentos no referenciados con la validación definida por el repositorio.

## 12. Incorporación de un nuevo documento

Antes de crear un archivo nuevo:

1. confirmar que el tema no está cubierto;
2. decidir si corresponde a arquitectura, ADR, RFC, módulo, guía o runbook;
3. definir propietario y estado;
4. enlazarlo desde este índice;
5. enlazar documentos relacionados;
6. agregar validación;
7. presentar el cambio mediante Pull Request.

## 13. Declaración final

> **La arquitectura debe ser navegable, verificable y útil para tomar decisiones.**

Este índice existe para que cualquier participante pueda descubrir rápidamente qué decisión rige, dónde está documentada, quién la mantiene y cómo puede modificarse de forma responsable.
