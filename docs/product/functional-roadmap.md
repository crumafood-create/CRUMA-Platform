# Roadmap funcional de CRUMA Platform

## Propósito

Este roadmap prioriza resultados verificables para ventas, inventario y producción. La presencia de una idea en el backlog no autoriza su implementación: cada iniciativa debe demostrar ROI, propietario, métrica y capacidad operativa.

## Correspondencia con la arquitectura

La [matriz de conciliación ERP/MES/WMS](erp-mes-wms-reconciliation.md)
contrasta las 19 capacidades industriales propuestas con el código verificado.
Debe consultarse antes de estimar una iniciativa o asignarle un módulo.

La matriz es un inventario con decisiones pendientes; no incorpora automáticamente
esas capacidades al alcance de este roadmap ni compromete las 24 semanas
propuestas. La telemetría de uso de este documento no equivale a sensores de
temperatura o monitoreo de frío IoT.

## Criterios de priorización

1. Protege ingresos, inventario o continuidad operativa.
2. Reduce tiempo manual medible o errores repetidos.
3. Usa capacidades ya existentes antes de incorporar infraestructura nueva.
4. Tiene adopción probable por un responsable identificado.
5. Puede entregarse y medirse en un ciclo corto.

## Ahora — retorno operativo inmediato

| Capacidad | Resultado | KPI | Criterio de salida |
|---|---|---|---|
| Reporte ejecutivo | Decisiones por periodo con una fuente común | Tiempo de preparación del reporte | Ventas, SKU, producción y uso visibles y exportables |
| CSV y PDF | Compartir evidencia sin trabajo manual | Exportaciones exitosas | Archivo descargable, filtrado y probado |
| Mobile online | Ejecutar recepción, producción y picking sin rutas rotas | Tareas completadas por móvil | Shell protegido, estados y targets táctiles consistentes |
| Telemetría mínima | Entender adopción sin almacenar PII adicional | Usuarios activos y páginas usadas | Solo eventos operativos aprobados y RLS activa |

## Siguiente — condicionado a evidencia

- alertas programadas de KPIs cuando los reportes tengan uso recurrente;
- filtros por almacén y responsable cuando existan suficientes operaciones multi-almacén;
- conteo físico móvil después de estabilizar recepción, producción y picking;
- comparación contra metas cuando Product Owner defina objetivos mensuales.

## Después — módulos no esenciales

- analítica predictiva avanzada;
- personalización de dashboards por usuario;
- constructor de reportes ad hoc;
- aplicación móvil nativa;
- integración con herramientas BI externas.

## Fuera de alcance

- offline completo, sincronización bidireccional y resolución automática de conflictos;
- nuevos módulos sin propietario, métrica de adopción o impacto económico;
- recopilación de texto libre, ubicación precisa o datos sensibles para analítica;
- exportadores configurables que dupliquen una plataforma BI.

## Control de scope creep

Toda solicitud nueva debe incluir problema, usuario, frecuencia, impacto, alternativa manual, KPI y Criterio de salida. Si no puede demostrar retorno o reducir un riesgo vigente, permanece en evaluación y no bloquea el roadmap actual.
