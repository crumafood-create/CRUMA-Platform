# CRUMAFOOD ERP

> **Simplificar la operación. Garantizar la trazabilidad. Construir con calidad.**

---

# Bienvenido

Bienvenido a **CRUMAFOOD ERP**, una plataforma diseñada para administrar de forma integral los procesos de manufactura, distribución y comercialización de alimentos.

Este proyecto nace con un objetivo claro: ofrecer una solución moderna, escalable y especializada para empresas que necesitan controlar su operación en tiempo real, desde la compra de materias primas hasta la entrega del producto terminado al cliente.

CRUMAFOOD no es únicamente una aplicación web.

Es una plataforma empresarial construida bajo principios de arquitectura limpia, trazabilidad completa y evolución continua.

---

# ¿Qué es CRUMAFOOD ERP?

CRUMAFOOD ERP es un sistema integrado de planificación de recursos empresariales (Enterprise Resource Planning) especializado en la industria alimentaria.

Su propósito es centralizar la información y los procesos críticos de la empresa en una única plataforma, evitando la duplicidad de datos y permitiendo que todas las áreas trabajen sobre la misma fuente de información.

Entre los procesos que administra se encuentran:

- Inventario
- Producción
- Recetas
- Compras
- Ventas
- Picking
- Warehouse
- Logística
- Calidad
- Costos
- Reportes
- Business Intelligence

Cada módulo comparte la misma arquitectura y utiliza una única fuente de verdad para los datos.

---

# El problema que resolvemos

Muchas pequeñas y medianas empresas de alimentos administran su operación utilizando múltiples herramientas independientes:

- Hojas de cálculo.
- Sistemas de facturación.
- Aplicaciones de mensajería.
- Registros manuales.
- Procesos en papel.

Como consecuencia aparecen problemas recurrentes:

- Diferencias entre inventario físico y sistema.
- Pérdida de trazabilidad.
- Desperdicio de materias primas.
- Duplicidad de información.
- Procesos manuales.
- Baja productividad.
- Decisiones basadas en información incompleta.

CRUMAFOOD nace para resolver estos problemas mediante una plataforma integrada que conecta todas las áreas de la empresa.

---

# Nuestra misión

Desarrollar una plataforma ERP moderna que permita a las empresas de alimentos administrar sus procesos de forma eficiente, segura y trazable, proporcionando información confiable para la toma de decisiones.

---

# Nuestra visión

Convertirnos en una plataforma ERP especializada en manufactura y distribución de alimentos para pequeñas y medianas empresas de Latinoamérica, reconocida por su simplicidad, trazabilidad y escalabilidad.

---

# Principios del proyecto

El desarrollo de CRUMAFOOD se basa en los siguientes principios:

## Simplicidad

La complejidad debe resolverse dentro del sistema, nunca trasladarse al usuario.

## Trazabilidad

Todo movimiento debe poder rastrearse desde su origen hasta su destino.

## Calidad

La calidad del software es parte del producto.

## Escalabilidad

Cada módulo debe evolucionar sin afectar a los demás.

## Consistencia

Toda la plataforma comparte el mismo lenguaje técnico y funcional.

## Modularidad

Cada dominio de negocio evoluciona de manera independiente.

---

# Filosofía de ingeniería

Las siguientes reglas guían todas las decisiones técnicas del proyecto.

## Una única fuente de verdad

Los datos nunca deben duplicarse.

## La lógica de negocio vive en un solo lugar

Cada regla del negocio debe implementarse una sola vez.

## Mobile First para la operación

Los procesos operativos deben ejecutarse de forma rápida y sencilla desde dispositivos móviles.

## Admin First para la gestión

La administración debe proporcionar herramientas para la configuración, análisis y toma de decisiones.

## La documentación forma parte del producto

Todo cambio relevante en la arquitectura debe reflejarse en la documentación oficial.

---

# Arquitectura general

```text
                  React UI
                      │
              Server Actions
                      │
          Application Services
                      │
                 Domain Layer
                      │
    Supabase (PostgreSQL + Auth + RLS)
```

Esta arquitectura busca mantener separadas las responsabilidades de presentación, lógica de negocio y persistencia de datos.

---

# Módulos del ERP

Actualmente el proyecto contempla los siguientes módulos:

| Módulo | Estado |
|---------|---------|
| Inventario | 🟢 En desarrollo |
| Producción | 🟢 En desarrollo |
| Picking | 🟢 En desarrollo |
| Warehouse | 📋 Planeado |
| Compras | 📋 Planeado |
| Ventas | 📋 Planeado |
| Calidad | 📋 Planeado |
| MRP | 📋 Planeado |
| Costos | 📋 Planeado |
| Reportes | 📋 Planeado |
| Business Intelligence | 📋 Planeado |

---

# Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15 |
| UI | React 19 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth |
| Hosting | Vercel |

---

# Flujo general del negocio

```text
Compras
    │
Recepción
    │
Inventario
    │
Producción
    │
Producto Terminado
    │
Picking
    │
Despacho
    │
Cliente
```

Cada módulo interactúa con los demás mediante procesos claramente definidos y manteniendo la trazabilidad completa de la operación.

---

# Organización del proyecto

El código fuente se organiza por dominios de negocio para facilitar su mantenimiento y escalabilidad.

```text
src/
│
├── app/
│   ├── (admin)/
│   └── mobile/
│
├── modules/
│   ├── inventory/
│   ├── production/
│   ├── picking/
│   ├── warehouse/
│   ├── purchasing/
│   ├── sales/
│   ├── quality/
│   └── shared/
│
├── infrastructure/
│
├── components/
│
└── lib/
```

Cada módulo contiene su propia lógica de negocio y puede evolucionar de forma independiente.

---

# Roadmap

## Versión 1

- Inventario
- Producción
- Picking

## Versión 2

- Compras
- Ventas
- Warehouse

## Versión 3

- Calidad
- MRP
- Costos

## Versión 4

- Business Intelligence
- Automatizaciones
- Inteligencia Artificial

---

# Documentación

Toda la documentación oficial del proyecto se encuentra en:

```text
docs/
└── architecture/
```

Entre otros documentos:

- Principios de arquitectura.
- Organización del proyecto.
- Convenciones de desarrollo.
- Arquitectura de Producción.
- Arquitectura de Inventario.
- Arquitectura Mobile.
- Modelo de datos.
- Seguridad.
- Roadmap.
- Glosario.
- ADR (Architecture Decision Records).

---

# Cómo contribuir

Todo cambio realizado en el proyecto debe:

- Seguir la arquitectura oficial.
- Mantener el tipado fuerte de TypeScript.
- Evitar la duplicación de lógica.
- Actualizar la documentación cuando sea necesario.
- Mantener un código simple, legible y mantenible.

La documentación forma parte del producto y debe evolucionar junto con el código.

---

# Estado del proyecto

**Versión actual:** En desarrollo

**Arquitectura:** Modular

**Modelo de desarrollo:** Domain-Oriented + Application Services

**Estado del Sprint:** Foundation & Standards

---

# Licencia

Este proyecto es propiedad de **CRUMAFOOD ERP**.

Todos los derechos reservados.

---

> **Arquitectura primero. Calidad siempre. El negocio como prioridad.**
