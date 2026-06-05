# CRUMA Platform — Executive Thread

## Propósito
Definir la secuencia mental y visual que seguirá la plataforma para convertir datos en decisiones y decisiones en acciones.

## Principio UX
La interfaz no debe mostrar “pantallas”. Debe mostrar un hilo ejecutivo continuo con este orden:

**Contexto → Análisis → Recomendación → Aprobación → Ejecución → Resultado → Memoria**

## Flujo principal
1. El sistema detecta un evento operativo o financiero.
2. Resume el contexto en una frase corta.
3. Genera una recomendación concreta.
4. Solicita una única decisión del usuario.
5. Ejecuta la acción.
6. Presenta el resultado.
7. Guarda el aprendizaje en memoria.

## Estados del hilo
### 1) Contexto detectado
- Qué pasó
- Dónde pasó
- A quién impacta
- Qué riesgo existe

### 2) Análisis
- Prioridad
- Impacto económico
- Tiempo estimado
- Confianza del sistema

### 3) Recomendación
- Acción sugerida
- Alternativas si existen
- Costo / beneficio
- Riesgo de no actuar

### 4) Aprobación
- Una sola acción primaria
- Opcional: ver razones
- Opcional: delegar
- Opcional: ignorar por hoy

### 5) Ejecución
- Confirmación visible
- Estado de progreso
- Mensaje breve de sistema
- Efecto sobre el negocio

### 6) Resultado
- Qué cambió
- Qué se resolvió
- Qué quedó pendiente
- Impacto esperado o real

### 7) Memoria
- Registrar decisión
- Registrar contexto
- Registrar resultado
- Aprender patrones de aprobación

## Reglas de interacción
- La conversación debe sentirse continua.
- No abrir modales innecesarios.
- No cambiar de pantalla si puede resolverse en el mismo flujo.
- La IA debe hablar primero cuando detecte una prioridad alta.
- Cada recomendación debe incluir una siguiente acción clara.
- El usuario nunca debe preguntarse “¿y ahora qué hago?”.

## Jerarquía visual
- 1 prioridad activa
- 1 acción principal
- 1 explicación expandible
- 1 cola de siguiente prioridad
- Memoria lateral secundaria

## Microcopy sugerido
- “Acción requerida”
- “Siguiente prioridad detectada”
- “Preparé la orden”
- “Solo necesito tu aprobación”
- “¿Por qué?”
- “Resultado ejecutado”
- “Aprendido por el sistema”

## Éxito del sistema
El hilo ejecutivo funciona si:
- el usuario entiende la prioridad en menos de 5 segundos
- la acción principal es obvia
- el resultado se confirma visualmente
- la plataforma recuerda lo ocurrido después

## Criterio final
Si una nueva funcionalidad no encaja en este hilo, no debe entrar en el home.
