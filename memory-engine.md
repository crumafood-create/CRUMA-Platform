# CRUMA Platform — Memory Engine

## Propósito
Definir qué recuerda CRUMA, cómo lo recuerda y cómo usa ese historial para mejorar decisiones futuras.

## Objetivo UX
La memoria no debe sentirse como logs técnicos. Debe sentirse como **contexto inteligente**.

## Qué debe recordar el sistema
### Decisiones
- compras aprobadas
- cobranzas enviadas
- turnos extra activados
- promociones lanzadas
- ajustes de precio
- contrataciones
- autorizaciones de pago
- cancelaciones o rechazos

### Resultados
- impacto en utilidad
- impacto en flujo de caja
- impacto en producción
- impacto en ventas
- impacto en stock
- impacto en tiempos de entrega

### Preferencias del CEO
- proveedores preferidos
- acciones que suele aprobar
- acciones que suele rechazar
- umbrales de riesgo aceptables
- tono de comunicación preferido
- horarios de trabajo habituales

### Patrones operativos
- productos que rotan más
- meses de mayor demanda
- proveedores con mejor cumplimiento
- clientes con mayor riesgo de mora
- acciones que mejor convierten en utilidad

## Tipos de memoria
### 1) Memoria corta
- Estado actual
- Última acción ejecutada
- Prioridad en curso
- Vigencia: minutos u horas

### 2) Memoria operativa
- Decisiones del día
- Alertas abiertas
- Acciones en progreso
- Vigencia: días

### 3) Memoria histórica
- Tendencias
- Aprendizajes
- Reglas de negocio
- Vigencia: permanente

## Estructura recomendada para cada memoria
- ID
- tipo
- origen
- contexto
- acción
- resultado
- impacto
- fecha
- confianza
- estado

## Reglas de memoria
- Guardar solo información útil para decisiones.
- No guardar ruido.
- No duplicar eventos.
- Relacionar cada decisión con su resultado.
- Permitir búsqueda rápida por cliente, proveedor, producto o acción.
- Diferenciar entre “ejecutado”, “pendiente”, “fallido” y “anulado”.

## Cómo debe verse en la UI
### Panel lateral
- Decisiones recientes
- Resultados obtenidos
- Última acción
- Estado de confianza

### Vista expandida
- Línea del tiempo de decisiones
- Resultado económico
- Comentarios del sistema
- Siguiente recomendación sugerida

## Preguntas que la memoria debe responder
- ¿Qué decidió Rafael antes en casos similares?
- ¿Qué acción generó mejor ROI?
- ¿Qué proveedor respondió más rápido?
- ¿Qué clientes requieren seguimiento?
- ¿Qué producto suele generar escasez?
- ¿Qué decisión se repite con mayor éxito?

## Señales de buena memoria
- el sistema propone acciones más precisas
- las recomendaciones tienen mejor contexto
- el CEO siente continuidad entre sesiones
- el usuario puede retomar la conversación sin perder estado

## Señales de mala memoria
- recomendaciones genéricas
- decisiones repetidas sin aprendizaje
- demasiados datos sin relevancia
- historial difícil de entender
- memoria técnica sin valor de negocio

## Criterio final
La memoria solo existe si mejora la decisión siguiente.
