# CRUMA Platform — Actions Catalog

## Propósito
Definir el catálogo de acciones que CRUMA puede sugerir, preparar o ejecutar.

## Principio UX
Cada acción debe ser:
- clara
- medible
- ejecutable
- reversible cuando sea posible
- vinculada a un resultado de negocio

## Categorías principales

### Operaciones
- Crear orden de compra
- Aprobar orden de compra
- Reasignar inventario
- Activar turno extra
- Cerrar producción
- Cambiar prioridad de lote
- Registrar merma
- Confirmar recepción de insumos

### Inventario
- Generar reposición
- Bloquear SKU crítico
- Transferir stock
- Ajustar inventario
- Revisar caducidades
- Recalcular cobertura
- Detectar quiebre de stock

### Finanzas
- Enviar cobranza
- Crear recordatorio de pago
- Aprobar gasto
- Bloquear crédito
- Autorizar reembolso
- Conciliar pago
- Generar flujo proyectado

### Comercial / Ventas
- Crear oportunidad
- Asignar vendedor
- Enviar propuesta
- Aplicar descuento
- Lanzar promoción
- Reactivar cliente inactivo
- Priorizar lead

### Producción
- Programar lote
- Cambiar receta
- Ajustar capacidad
- Aprobar uso de insumos
- Recalcular costo por lote
- Activar producción extra
- Pausar línea

### Logística
- Confirmar despacho
- Reprogramar entrega
- Priorizar ruta
- Notificar retraso
- Validar transporte
- Cambiar fecha de salida

### Recursos Humanos
- Aprobar horas extra
- Revisar asistencia
- Asignar turno
- Aprobar contratación
- Registrar capacitación

### Administración
- Cambiar rol
- Aprobar permiso
- Revisar auditoría
- Exportar informe
- Configurar alertas
- Ajustar umbrales

## Estructura estándar de una acción
- Nombre
- Descripción breve
- Prioridad
- Riesgo
- Impacto estimado
- Tiempo estimado
- Requiere aprobación
- Se puede revertir
- Resultado esperado

## Reglas de diseño para cada acción
- Una acción principal por tarjeta
- Una alternativa secundaria máxima
- Mostrar impacto económico cuando aplique
- Mostrar tiempo estimado
- Mostrar riesgo o urgencia si es relevante
- Usar microcopy orientado a negocio

## Estados de acción
- sugerida
- preparada
- aprobada
- ejecutándose
- completada
- fallida
- revertida

## Criterio UX
Si una acción no puede explicarse en una frase breve, todavía no está lista para entrar al sistema.

## Prioridad de implementación
### Fase 1
- cobranza
- compra de inventario
- turno extra
- aprobación de gasto

### Fase 2
- promociones
- reasignación de stock
- programación de lotes
- ajustes de precio

### Fase 3
- automatizaciones
- acciones masivas
- workflows multi-paso

## Criterio final
El catálogo debe crecer con el negocio, no con la complejidad técnica.
