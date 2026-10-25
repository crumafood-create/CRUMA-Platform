# Conciliación ERP/MES/WMS: roadmap y arquitectura real

| Campo | Valor |
|---|---|
| Estado | Inventario documental revisable; decisiones arquitectónicas pendientes |
| Fecha de verificación | 25 de octubre de 2026 |
| Base de código | main, commit e89fd4176d0a9e055e47794081927ef9d51538c8 |
| Alcance | 19 capacidades industriales agrupadas en cinco pilares |
| Método | Inspección estática de rutas, módulos, contratos, migraciones y pruebas versionadas |
| Referencias | [Arquitectura del repositorio](../../ARCHITECTURE.md), [Business Core][E01], [roadmap funcional](functional-roadmap.md), [proceso ADR](../architecture/adr/README.md) |

## 1. Propósito y lectura de la matriz

Este documento concilia el mapa industrial propuesto para CRUMAFOOD OS con la
implementación de CRUMA-Platform. Los 19 frentes son capacidades de negocio:
no representan necesariamente 19 carpetas, aplicaciones o servicios.

El propietario lógico procede de Business Core cuando ese documento lo define.
La ubicación actual indica dónde está el código, sin convertir esa ubicación
en una decisión arquitectónica definitiva. Un propietario pendiente no se
asigna por semejanza del nombre de una carpeta.

“Parcial” significa que hay un corte de implementación, no que todo el alcance
industrial esté entregado. “Reservado” significa estructura sin caso de uso
demostrado en ese módulo. “Sin módulo dedicado” no prueba ausencia absoluta
de lógica relacionada en otras capas.

La revisión no ejecutó las pruebas citadas ni verificó producción, hardware,
integraciones externas o cumplimiento normativo. La evidencia corresponde
al commit indicado; debe renovarse si cambia la capacidad.

## 2. Matriz documental

| ID y capacidad | Propietario lógico de referencia | Ubicación actual y evidencia | Alcance implementado observado | Brecha pendiente |
|---|---|---|---|---|
| 01 Centro de Mando | Reporting, como capacidad analítica descrita en la visión general [E02] | analytics/application y rutas dashboard/reports [E03] | Dashboard, consultas de reportes, filtros y exportación | Verificar los KPI industriales propuestos; no se demuestra monitoreo térmico u OEE completo |
| 02 Finanzas, SAT y Costeo | Costing para reglas de costo [E01]; frontera de finance por conciliar | finance/application; production/application/production-cost-*; RPC settle_production_cost [E04] [E05] | Facturación comercial, CxC/abonos y costeo con materiales, MOD, indirectos y costo unitario | Definir frontera de Costing; completar fuentes y reglas de absorción. MOD/CIF recibidos como importes no prueban cálculo automático. PAC/CFDI es futuro |
| 03 Pedidos B2B, Ventas y CRM | Sales [E01] | sales/application y customers; crm y orders reservados [E06] | Clientes, cotizaciones y pedidos comerciales | Definir requisitos B2B y CRM por caso de uso; no hay dos motores activos sales/crm demostrados |
| 04 Catálogo y SKUs | Catalog [E01] | Formularios en catalog; contratos/repositorios en inventory [E07] | Productos, categorías, familias, sabores, preparación y referencias de unidades | Alinear responsabilidades; verificar GTIN, vida útil, alérgenos y atributos térmicos antes de prometer el catálogo industrial completo |
| 05 Compras y Proveedores | Purchasing lógico, implementado con el nombre procurement [E01] | procurement/application y rutas de compras; recepción en warehouse/mobile [E08] | Proveedores, solicitudes, aprobaciones, órdenes y recepción | Precisar política de COA, documento aceptado, responsable y punto de bloqueo |
| 06 Inventario y WMS FEFO | Inventory para existencias; Warehouse para operación física [E01] | inventory, warehouse, production y RPC SQL de consumo; consulta FEFO de picking [E09] [E10] | Movimientos, saldos, lotes, ubicaciones, picking y consumo FEFO transaccional de materia prima | Definir contrato y alcance reutilizable; revisar coherencia entre sugerencia y consumo sin perder atomicidad |
| 07 Despachos, Logística y Frío | Distribution [E01] | logistics y fulfillment reservados; picking activo en warehouse [E11] | Preparación de surtido como antecedente | No se demuestra despacho completo, rutas, entrega confirmada ni monitoreo térmico de transporte |
| 08 Devoluciones, Mermas y RMA | Quality para disposición; propietario de devolución comercial por definir [E01] | Sin módulo dedicado RMA; disposición interna en production y SQL [E12] | Descarte y retrabajo de producto no conforme vinculado a inspección | Diseñar devolución de cliente y sus efectos sobre inventario, crédito y trazabilidad; no confundirla con disposición interna |
| 09 Formulación, BOM e I+D | Production [E01] | recipe-* en production/application; formularios en manufacturing [E13] | Recetas, ingredientes y validación de referencias | Aclarar transición de capas; verificar versionado, alérgenos, experimentación y aprobación de formulaciones |
| 10 Plan Maestro MRP/MPS | Propietario específico pendiente; coordinación con Production | Ruta /mrp; scheduling reservado [E14] | Consulta mrp_requirements, consulta existencias y calcula faltantes | No demuestra MPS, capacidad finita ni generación automática de OP desde demanda; definir dueño del caso de uso |
| 11 Lotes, Producción y Rework | Production; Quality autoriza disposición [E01] | production/application y migraciones de órdenes, consumos y disposición [E09] [E12] [E15] | Órdenes, consumos, lotes, rendimientos, cuarentena y creación de orden de retrabajo por no conformidad | Validar trazabilidad de reincorporación de recortes y regla del 18%; el retrabajo existente no demuestra esa regla |
| 12 Telemetría y Frío IoT | Pendiente de decisión | Sin módulo dedicado identificado en src/modules | Sin flujo industrial de sensores demostrado en esta revisión | Definir sensores, ingestión, calibración, alarmas, responsables y evidencia; analítica de uso no equivale a IoT |
| 13 Calidad e Inocuidad | Quality [E01] | quality/application, inspecciones y funciones SQL de liberación [E16] | Inspecciones, bloqueos/liberaciones y control de materia prima/producto terminado | Contrastar procesos, registros y criterios industriales exigidos; la existencia de QC no acredita NOM-251/COFEPRIS |
| 14 POES y Sanitización | Pendiente; Quality participa en liberación | Sin módulo dedicado identificado | Sin flujo POES demostrado en esta revisión | Definir checklist, evidencia, vigencia y bloqueo de arranque; no asignar carpeta antes del caso de uso |
| 15 Recall y Trazabilidad Inversa | Orquestación pendiente entre Production, Inventory, Sales y Distribution | Lotes, consumos y pruebas de trazabilidad en production [E15] | Base de trazabilidad productiva | Demostrar cadena hasta cliente y despacho, simulacro y medición; no se acredita recall de un clic en menos de 15 minutos |
| 16 Mantenimiento CMMS/TPM | Pendiente de decisión | Sin módulo dedicado identificado | Sin flujo CMMS demostrado en esta revisión | Equipos, planes, órdenes de mantenimiento, horómetros y refacciones |
| 17 Utilities y Energía | Pendiente de decisión; Costing consume costos autorizados | Sin módulo dedicado identificado | Los importes de indirectos existentes no equivalen a medición de consumos [E05] | Definir fuentes, unidades, periodos y asignación de energía/servicios a producción |
| 18 RH y Mano de Obra | Pendiente para operación de RH; Costing para reglas de costo | hr reservado; production recibe laborCost [E05] | Captura de importe de mano de obra en costeo | Fichaje, asignación a OP y cálculo automático de MOD no demostrados |
| 19 Seguridad Industrial STPS/HSE | Pendiente de decisión | Sin módulo dedicado identificado | Sin flujo HSE demostrado en esta revisión | Definir EPP, incidentes, responsables, registros y criterios de aceptación |

## 3. Correcciones de interpretación y conteo

El mapa de origen desarrolla cinco pilares, aunque su introducción anuncia seis.
La matriz mantiene sus 19 capacidades y su numeración para conservar trazabilidad.

Hay seis capacidades sin módulo dedicado en el inventario: 08, 12, 14, 16, 17 y
19. No son seis capacidades necesariamente sin antecedentes: 08 ya cuenta con
descarte/retrabajo interno relacionado. Recall (15) es transversal y no se suma
a ese conteo como si faltara obligatoriamente una carpeta.

La existencia de scheduling reservado no elimina el MRP parcial en app.
La existencia de crm reservado no demuestra solape con sales.
La combinación de formularios y casos de uso en carpetas distintas tampoco
demuestra por sí sola dos implementaciones de las mismas reglas.

## 4. Fronteras que requieren conciliación

| Tema | Hecho verificado | Decisión o trabajo pendiente |
|---|---|---|
| Catálogo | Catalog es dueño lógico; hay contratos/repositorios en inventory | Definir transición y API pública sin duplicar el maestro |
| Producción y manufacturing | Production es dueño lógico; manufacturing aporta formularios/vistas y consulta | Documentar límite y compatibilidad antes de trasladar archivos |
| Costeo | Business Core define Costing; código industrial en production y comercial en finance | Ratificar o cambiar la frontera lógica y el plan incremental; no reducir la decisión a finance vs production |
| Ventas/CRM | Sales es dueño lógico de clientes/pedidos; crm y orders están reservados | Definir un caso de uso CRM antes de activar el módulo; no resolver un conflicto de motores no demostrado |
| MRP/MPS | Hay lectura de requerimientos/faltantes en app | Asignar dueño y contrato de planeación, distinguiendo MRP parcial de MPS |
| COA y dms | dms está reservado; el roadmap exige COA | Separar almacenamiento/evidencia, validación de Calidad y bloqueo de recepción; dms es una alternativa, no una elección aprobada |
| supply-chain | Carpeta reservada, sin caso de uso demostrado | Definir consumidor y responsabilidad o proponer retiro; este inventario no activa ni elimina el módulo |

Los hechos se corrigen en la documentación. Los cambios de frontera costosos
de revertir se decidirán mediante el [proceso ADR](../architecture/adr/README.md).
Esta matriz no sustituye decisiones vigentes ni aprueba las alternativas.

### FEFO: preservar la autoridad transaccional

El repositorio de producción invoca consume_production_material_fefo. La
función SQL selecciona el lote elegible por caducidad, creación e ID; bloquea
filas, comprueba el lote escaneado y registra consumo, movimientos y auditoría
en la misma transacción. Picking tiene una consulta separada de sugerencias.

Un contrato público o puerto de Inventory/Warehouse puede ser una dirección de
diseño, pero no obliga a extraer la selección fuera de la transacción SQL.
La selección autoritativa y el consumo no deben convertirse en llamadas
independientes sin garantías equivalentes. La ubicación actual no demuestra,
por sí sola, un import prohibido entre módulos.

Cualquier cambio de este límite requiere pruebas de concurrencia, elegibilidad
de lotes, caducidad, cantidades, rollback, autorización e idempotencia.

## 5. Alcance, estimaciones y orden de trabajo

Las 24 semanas del mapa de origen son una hipótesis pendiente de dimensionar.
Para convertirla en compromiso faltan equipo/capacidad, alcance mínimo,
dependencias externas, hardware, migración de datos y criterios de aceptación.

Los nombres SAT, NOM-251, COFEPRIS y STPS del roadmap expresan alcance deseado;
no acreditan integración fiscal o cumplimiento normativo implementado.
El 18% de reincorporación y los 15 minutos de recall requieren validación
operativa y pruebas específicas antes de figurar como resultados entregados.

Esta matriz no agrega automáticamente alcance al roadmap funcional vigente.
Los 19 frentes industriales tampoco agotan la plataforma: storefront,
experiencias de clientes, mobile, identidad, permisos, aislamiento por
organización/planta y operación técnica requieren su propio backlog.
Las áreas actuales conviven principalmente en una aplicación Next.js; no se
infiere la existencia de apps nativas independientes por el mapa de negocio.

Orden propuesto para continuar:

1. Revisar esta matriz y corregir discrepancias con evidencia del código.
2. Resolver las fronteras necesarias para el siguiente caso de uso, empezando
   por respetar los propietarios lógicos ya documentados.
3. Registrar el ADR cuando cambie o se concrete una decisión arquitectónica
   material; definir criterios de aceptación y estrategia de migración.
4. Implementar un corte vertical con pruebas, renovando matriz, arquitectura y
   roadmap en el mismo PR cuando cambie el alcance observado.

No se crean carpetas vacías para representar capacidades futuras.

## 6. Evidencia versionada

Todas las referencias siguientes se inspeccionaron en la base de código
declarada. Los enlaces relativos acompañan las futuras versiones del repositorio;
para reproducir este inventario debe consultarse el commit de la cabecera.
Las pruebas enlazadas son evidencia versionada, no resultados de ejecución
obtenidos por esta revisión documental.

- [E01] Business Core, secciones 7 y 8: propietarios lógicos y datos.
- [E02] Visión general, sección 8: capacidades y Reporting.
- [E03] Analytics: contratos, repositorios y exportadores.
- [E04] Finance: facturación comercial y frontera fiscal futura.
- [E05] Production: contratos y liquidación de costos.
- [E06] Sales: contratos y repositorios comerciales.
- [E07] Inventory: contrato de acceso al catálogo de productos.
- [E08] Procurement: contratos y repositorios de compras.
- [E09] RPC SQL de consumo FEFO de materia prima.
- [E10] Sugerencia FEFO para picking.
- [E11] Warehouse: vistas y servicios de operación.
- [E12] SQL de disposición de producto no conforme y retrabajo.
- [E13] Production: validación de recetas e ingredientes.
- [E14] Pantalla de requerimientos y faltantes MRP.
- [E15] Prueba de contrato de trazabilidad de lotes.
- [E16] Quality: inspecciones y contratos de calidad.

[E01]: ../architecture/business-core.md
[E02]: ../architecture/system-overview.md
[E03]: ../../src/modules/analytics/application/
[E04]: ../../src/modules/finance/application/fiscal-invoice-gateway.ts
[E05]: ../../src/modules/production/application/production-cost-contract.ts
[E06]: ../../src/modules/sales/application/
[E07]: ../../src/modules/inventory/application/product-catalog-repository.ts
[E08]: ../../src/modules/procurement/application/
[E09]: ../../supabase/migrations/20260928020000_harden_production_material_consumption.sql
[E10]: <../../src/app/mobile/picking/fefo-actions.ts>
[E11]: ../../src/modules/warehouse/
[E12]: ../../supabase/migrations/20261001010000_harden_finished_product_nonconformance_disposition.sql
[E13]: ../../src/modules/production/application/recipe-repository.ts
[E14]: <../../src/app/(admin)/mrp/page.tsx>
[E15]: ../../src/modules/production/application/production-lot-traceability.test.ts
[E16]: ../../src/modules/quality/application/
