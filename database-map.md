# CRUMA Platform — Database Map

## Propósito
Definir las entidades base del sistema para soportar la experiencia de copiloto ejecutivo.

## Principio UX / Data
La base de datos debe reflejar decisiones reales del negocio, no solo pantallas.

## Entidades principales

### users
Representa a los usuarios del sistema.
- id
- tenant_id
- name
- email
- role
- status
- last_login_at
- created_at

### tenants
Representa empresas o unidades de negocio.
- id
- name
- slug
- plan
- status
- industry
- timezone
- created_at

### products
Catálogo de productos.
- id
- tenant_id
- name
- sku
- category
- unit_cost
- unit_price
- active
- created_at

### inventory
Estado de stock por producto y ubicación.
- id
- tenant_id
- product_id
- warehouse_id
- stock_on_hand
- stock_reserved
- reorder_point
- coverage_hours
- updated_at

### suppliers
Proveedores.
- id
- tenant_id
- name
- contact_name
- phone
- email
- lead_time_hours
- reliability_score
- created_at

### purchase_orders
Órdenes de compra.
- id
- tenant_id
- supplier_id
- status
- total_amount
- eta_hours
- created_by
- approved_by
- created_at

### production_orders
Órdenes de producción.
- id
- tenant_id
- product_id
- status
- planned_qty
- actual_qty
- shift
- started_at
- completed_at

### customers
Clientes.
- id
- tenant_id
- name
- segment
- risk_score
- credit_status
- payment_terms
- created_at

### invoices
Facturación y cobranza.
- id
- tenant_id
- customer_id
- status
- total_amount
- due_date
- paid_at
- overdue_days

### decisions
Registro central del Executive Thread.
- id
- tenant_id
- actor_user_id
- source_type
- source_id
- priority
- recommendation
- action_taken
- result
- impact_amount
- confidence
- status
- created_at

### memory_entries
Memoria operativa e histórica.
- id
- tenant_id
- decision_id
- memory_type
- summary
- tags
- importance_score
- created_at

### alerts
Alertas operativas y financieras.
- id
- tenant_id
- type
- severity
- title
- description
- status
- source
- created_at

### activities
Historial de actividad del sistema.
- id
- tenant_id
- actor_user_id
- action_type
- title
- metadata
- created_at

### notifications
Notificaciones al usuario.
- id
- tenant_id
- user_id
- title
- body
- read_at
- status
- created_at

## Relaciones clave
- tenant tiene muchos users
- tenant tiene muchos products
- tenant tiene muchos suppliers
- tenant tiene muchas purchase_orders
- tenant tiene muchas production_orders
- tenant tiene muchos customers
- tenant tiene muchas invoices
- decisions se relaciona con alerts, activities y memory_entries
- memory_entries deriva de decisions

## Campos recomendados para UX
- status
- priority
- confidence
- impact_amount
- created_at
- updated_at
- source_type
- source_id

## Reglas de modelado
- guardar trazabilidad completa
- enlazar cada recomendación con su resultado
- permitir lectura rápida en UI
- evitar tablas que solo existan por técnica y no por negocio

## Criterio final
Si una entidad no ayuda a explicar una decisión o ejecutar una acción, no debe existir.
