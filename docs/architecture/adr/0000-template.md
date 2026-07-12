# ADR-NNNN: [Título de la decisión]

> **Instrucción:** copia este archivo, asigna el siguiente número disponible y reemplaza todos los placeholders. `0000` está reservado para la plantilla y nunca representa una decisión real.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | AAAA-MM-DD |
| Decisores | [Roles con autoridad para decidir] |
| Consultados | [Roles, equipos o personas consultadas] |
| Informados | [Áreas que deben conocer la decisión] |
| Propietario | [Rol responsable de mantener la decisión] |
| Alcance | [Sistemas, módulos, datos, clientes o procesos afectados] |
| Reemplaza | [ADR-NNNN o No aplica] |
| Reemplazado por | [ADR-NNNN o No aplica] |
| RFC relacionado | [Enlace o No aplica] |
| Issues relacionados | [Enlaces o No aplica] |

---

## 1. Resumen ejecutivo

[Resume en uno o dos párrafos el problema, la decisión propuesta y su consecuencia principal.]

La decisión es:

> **[Escribe una frase concreta, verificable, acotada y en presente.]**

---

## 2. Contexto

[Describe la situación que hace necesaria esta decisión.]

Incluye solo hechos relevantes:

- estado actual;
- necesidad de negocio;
- limitaciones técnicas;
- incidentes o riesgos;
- dependencias;
- y razón para decidir ahora.

No presentes la solución preferida como si fuera el problema.

---

## 3. Problema

[Formula el problema que debe resolverse.]

Una formulación adecuada permite evaluar varias alternativas.

Preguntas útiles:

- ¿qué resultado no puede garantizarse hoy?;
- ¿qué riesgo permanece abierto?;
- ¿qué cambio está bloqueado?;
- ¿qué decisión será difícil de revertir?;
- y ¿qué persona futura preguntará por qué se eligió esta arquitectura?

---

## 4. Alcance

Esta decisión cubre:

- [Elemento incluido];
- [Elemento incluido];
- y [Elemento incluido].

Esta decisión no cubre:

- [Elemento excluido];
- [Elemento excluido];
- y [Elemento excluido].

Los elementos fuera de alcance no deberán resolverse implícitamente mediante este ADR.

---

## 5. Fuerzas de decisión

Las fuerzas relevantes son:

| Fuerza | Importancia | Implicación |
|---|---|---|
| Valor de negocio | Alta/Media/Baja | [Implicación] |
| Seguridad e integridad | Alta/Media/Baja | [Implicación] |
| Experiencia de usuario | Alta/Media/Baja | [Implicación] |
| Reversibilidad | Alta/Media/Baja | [Implicación] |
| Rendimiento y capacidad | Alta/Media/Baja | [Implicación] |
| Operación y soporte | Alta/Media/Baja | [Implicación] |
| Costo | Alta/Media/Baja | [Implicación] |
| Tiempo de entrega | Alta/Media/Baja | [Implicación] |
| Portabilidad | Alta/Media/Baja | [Implicación] |
| Experiencia del equipo | Alta/Media/Baja | [Implicación] |

Elimina las filas que no apliquen y agrega las fuerzas específicas del problema.

---

## 6. Restricciones

La decisión deberá respetar:

- [Restricción constitucional o arquitectónica];
- [Tecnología o proveedor vigente];
- [Compatibilidad requerida];
- [Regulación o privacidad];
- [Presupuesto o plazo];
- y [Restricción operacional].

Una restricción deberá distinguirse de una preferencia.

---

## 7. Supuestos

Esta evaluación asume que:

- [Supuesto verificable];
- [Supuesto verificable];
- y [Supuesto verificable].

Cada supuesto crítico deberá tener:

- evidencia;
- propietario;
- fecha de revisión;
- o trigger de reevaluación.

Si un supuesto falla, este ADR deberá revisarse.

---

## 8. Criterios de decisión

Las opciones se compararán mediante:

| Criterio | Peso o prioridad | Cómo se evalúa |
|---|---|---|
| [Criterio 1] | [Peso] | [Método o evidencia] |
| [Criterio 2] | [Peso] | [Método o evidencia] |
| [Criterio 3] | [Peso] | [Método o evidencia] |

Los pesos no deberán producir precisión falsa.

La comparación cualitativa deberá explicar su razonamiento.

---

## 9. Opciones consideradas

| Opción | Resumen | Resultado |
|---|---|---|
| A | [Descripción breve] | Elegida/No elegida |
| B | [Descripción breve] | Elegida/No elegida |
| C | [Descripción breve] | Elegida/No elegida |
| Mantener estado actual | [Consecuencia de no cambiar] | Elegida/No elegida |

Elimina “mantener estado actual” solo cuando realmente no sea una opción.

---

## 10. Opción A — [Nombre]

### Descripción

[Explica cómo funciona la opción y qué cambia.]

### Ventajas

- [Ventaja];
- [Ventaja];
- y [Ventaja].

### Desventajas

- [Desventaja];
- [Desventaja];
- y [Desventaja].

### Riesgos

- [Riesgo];
- y [Riesgo].

### Costo y operación

[Describe implementación, migración, proveedor, mantenimiento, skills y salida.]

### Evidencia

- [Spike, benchmark, documentación, incidente o prueba].

---

## 11. Opción B — [Nombre]

### Descripción

[Explica cómo funciona la opción y qué cambia.]

### Ventajas

- [Ventaja];
- [Ventaja];
- y [Ventaja].

### Desventajas

- [Desventaja];
- [Desventaja];
- y [Desventaja].

### Riesgos

- [Riesgo];
- y [Riesgo].

### Costo y operación

[Describe implementación, migración, proveedor, mantenimiento, skills y salida.]

### Evidencia

- [Spike, benchmark, documentación, incidente o prueba].

---

## 12. Opción C — [Nombre, si aplica]

### Descripción

[Explica cómo funciona la opción y qué cambia.]

### Ventajas

- [Ventaja].

### Desventajas

- [Desventaja].

### Riesgos

- [Riesgo].

### Costo y operación

[Describe implementación y mantenimiento.]

### Evidencia

- [Evidencia].

Elimina esta sección si solo existen dos opciones materiales.

---

## 13. Decisión

Se decide:

> **[Registra la decisión de forma concreta, verificable, acotada y en presente.]**

La decisión incluye:

- [Elemento decidido];
- [Límite];
- [Responsabilidad];
- [Condición];
- y [Excepción explícita].

La decisión no autoriza:

- [Uso fuera del alcance];
- ni [Interpretación incorrecta].

---

## 14. Razón de la decisión

Se elige [Opción] porque:

- [Razón relacionada con una fuerza];
- [Razón relacionada con evidencia];
- [Razón relacionada con riesgo];
- y [Razón relacionada con reversibilidad o costo].

No se elige [Otra opción] porque [razón].

El razonamiento deberá permitir entender por qué esta opción fue preferible en este contexto, no por qué es universalmente mejor.

---

## 15. Consecuencias positivas

- [Beneficio esperado];
- [Capacidad habilitada];
- [Riesgo reducido];
- y [Mejora operacional].

---

## 16. Consecuencias negativas

- [Complejidad aceptada];
- [Costo];
- [Dependencia];
- [Trabajo de migración];
- y [Limitación].

Las consecuencias negativas no se omitirán para favorecer la propuesta.

---

## 17. Consecuencias neutrales

- [Cambio que no es beneficio ni costo por sí mismo];
- [Responsabilidad que se mueve];
- y [Convención que deberá aprenderse].

---

## 18. Impacto arquitectónico

| Área | Impacto |
|---|---|
| Business Core | [Impacto o No aplica] |
| Datos | [Impacto o No aplica] |
| Seguridad | [Impacto o No aplica] |
| Integraciones | [Impacto o No aplica] |
| Despliegue | [Impacto o No aplica] |
| Frontend | [Impacto o No aplica] |
| Mobile | [Impacto o No aplica] |
| Desktop | [Impacto o No aplica] |
| Observabilidad | [Impacto o No aplica] |
| Pruebas | [Impacto o No aplica] |
| Rendimiento | [Impacto o No aplica] |
| Multi-tenancy | [Impacto o No aplica] |
| Design System | [Impacto o No aplica] |

---

## 19. Seguridad y privacidad

La decisión afecta:

- autenticación: [Sí/No y cómo];
- autorización: [Sí/No y cómo];
- datos sensibles: [Sí/No y cómo];
- secretos: [Sí/No y cómo];
- aislamiento: [Sí/No y cómo];
- auditoría: [Sí/No y cómo];
- amenazas: [Resumen];
- y respuesta a incidentes: [Resumen].

Controles requeridos:

- [Control];
- [Control];
- y [Control].

---

## 20. Datos y migraciones

La decisión requiere:

- cambio de esquema: [Sí/No];
- migración: [Sí/No];
- backfill: [Sí/No];
- compatibilidad: [Descripción];
- respaldo: [Descripción];
- verificación: [Descripción];
- y recuperación: [Descripción].

PostgreSQL/Supabase seguirá las reglas de [data-architecture.md](../data-architecture.md).

---

## 21. Rendimiento y capacidad

Se esperan efectos en:

- latencia: [Efecto];
- throughput: [Efecto];
- concurrencia: [Efecto];
- almacenamiento: [Efecto];
- red: [Efecto];
- límites: [Efecto];
- y costo por operación: [Efecto].

Evidencia requerida:

- [Baseline, benchmark, load test o métrica].

---

## 22. Operación

La decisión requiere:

- configuración: [Descripción];
- secretos: [Descripción];
- despliegue: [Descripción];
- health: [Descripción];
- alertas: [Descripción];
- runbook: [Enlace o pendiente];
- soporte: [Descripción];
- y ownership: [Rol].

---

## 23. Plan de transición

### Estado inicial

[Describe el estado desde el que se migra.]

### Fase 1 — [Nombre]

- [Acción];
- [Compatibilidad];
- [Validación];
- y [Criterio de salida].

### Fase 2 — [Nombre]

- [Acción];
- [Compatibilidad];
- [Validación];
- y [Criterio de salida].

### Fase 3 — [Nombre]

- [Acción];
- [Retiro];
- [Validación];
- y [Criterio de cierre].

Elimina fases innecesarias, pero conserva un cambio incremental cuando el riesgo lo requiera.

---

## 24. Rollback y roll-forward

Ante fallo:

- se detectará mediante [señal];
- se contendrá mediante [acción];
- se revertirá mediante [procedimiento], si es seguro;
- o se corregirá hacia adelante mediante [procedimiento].

Datos que no pueden revertirse:

- [Descripción o No aplica].

Condiciones que impiden rollback:

- [Descripción o No aplica].

---

## 25. Compatibilidad

Se deberá mantener compatibilidad con:

- versión desplegada: [Descripción];
- clientes soportados: [Descripción];
- esquema anterior: [Descripción];
- contratos externos: [Descripción];
- y datos existentes: [Descripción].

La ventana de compatibilidad termina cuando [criterio].

---

## 26. Validación

La decisión se considerará validada cuando:

- [Prueba o spike];
- [Criterio medible];
- [Revisión];
- [Piloto];
- y [Evidencia operacional].

No se considerará validada únicamente porque compile.

---

## 27. Estrategia de pruebas

Se requieren:

- unitarias: [Escenarios];
- integración: [Escenarios];
- contratos: [Escenarios];
- seguridad: [Escenarios positivos y negativos];
- migración: [Escenarios];
- E2E: [Flujos];
- rendimiento: [Escenarios];
- y pruebas operativas: [Escenarios].

La estrategia seguirá [testing-strategy.md](../testing-strategy.md).

---

## 28. Observabilidad

Se instrumentará:

- logs: [Eventos];
- métricas: [Métricas];
- trazas: [Operaciones];
- errores: [Categorías];
- alertas: [Condiciones];
- dashboard: [Vista];
- y correlación: [Campos].

La observabilidad seguirá [observability-architecture.md](../observability-architecture.md).

---

## 29. Riesgos y controles

| Riesgo | Condición | Impacto | Control | Propietario | Señal |
|---|---|---|---|---|---|
| [Riesgo] | [Cuándo ocurre] | [Impacto] | [Control] | [Rol] | [Métrica o alerta] |
| [Riesgo] | [Cuándo ocurre] | [Impacto] | [Control] | [Rol] | [Métrica o alerta] |

Los riesgos aceptados deberán indicarse explícitamente.

---

## 30. Costos

### Implementación

[Esfuerzo, migración, capacitación y herramientas.]

### Operación

[Licencias, infraestructura, soporte, observabilidad y guardias.]

### Costo de salida

[Portabilidad, exportación, reescritura, migración y plazo.]

### Costo de no decidir

[Riesgo, bloqueo, deuda o pérdida de valor.]

---

## 31. Cumplimiento arquitectónico

Documentos afectados:

- [Índice de arquitectura](../README.md);
- [Documento arquitectónico relacionado];
- [Documento arquitectónico relacionado];
- y [Otro documento].

Cambios documentales requeridos:

- [Cambio];
- y [Cambio].

No se aceptará el ADR si contradice un documento de mayor autoridad sin resolución explícita.

---

## 32. Plan de implementación

| Entrega | Alcance | Propietario | Dependencia | Evidencia |
|---|---|---|---|---|
| [Entrega 1] | [Alcance] | [Rol] | [Dependencia] | [Prueba o métrica] |
| [Entrega 2] | [Alcance] | [Rol] | [Dependencia] | [Prueba o métrica] |

Issues:

- [Enlace];
- y [Enlace].

El estado del ADR no representa el porcentaje implementado.

---

## 33. Preguntas abiertas

- [Pregunta que debe resolverse antes de Aceptado];
- [Pregunta que puede resolverse durante implementación];
- y [Pregunta que dispara revisión futura].

Una pregunta que cambia la decisión deberá resolverse antes de aceptar.

---

## 34. Triggers de revisión

Este ADR deberá revisarse cuando:

- [Supuesto deje de ser cierto];
- [Volumen alcance un umbral];
- [Proveedor cambie];
- [Ocurra un incidente];
- [Llegue una fecha];
- o [Aparezca una nueva obligación].

Fecha de revisión sugerida: [AAAA-MM-DD o No aplica].

---

## 35. Referencias

- [Registro ADR](README.md)
- [Índice de arquitectura](../README.md)
- [RFC relacionado]
- [Documentación oficial]
- [Benchmark o spike]
- [Issue]
- [Pull Request]
- [Runbook]

Elimina referencias vacías antes de solicitar aprobación.

---

## 36. Registro de aprobación

| Rol | Decisión | Fecha | Evidencia |
|---|---|---|---|
| [Decisor] | Acepta/Rechaza/Solicita cambios | AAAA-MM-DD | [Enlace o comentario] |

La aprobación verbal deberá registrarse en el repositorio.

---

## 37. Historial

| Fecha | Cambio | Autor o rol |
|---|---|---|
| AAAA-MM-DD | Propuesta inicial | [Rol] |

Después de Aceptado, solo se permiten correcciones no semánticas y metadata de reemplazo.

Un cambio de decisión requiere un ADR nuevo.

---

## 38. Checklist antes de proponer

- [ ] Se asignó el siguiente número disponible.
- [ ] Se reemplazaron todos los placeholders.
- [ ] El título describe una decisión.
- [ ] El problema no presupone la solución.
- [ ] El alcance está delimitado.
- [ ] Las fuerzas son explícitas.
- [ ] Se evaluaron opciones materiales.
- [ ] Se incluyó mantener el estado actual cuando aplica.
- [ ] La decisión es concreta y verificable.
- [ ] Las consecuencias negativas son visibles.
- [ ] Se analizaron seguridad, datos, rendimiento y operación.
- [ ] Se definieron transición y recuperación.
- [ ] Se definió validación.
- [ ] Se enlazaron documentos afectados.
- [ ] Se actualizó el índice ADR.
- [ ] No se incluyeron secretos ni datos sensibles.

---

## 39. Checklist antes de aceptar

- [ ] La autoridad de decisión está confirmada.
- [ ] Las personas necesarias fueron consultadas.
- [ ] Las preguntas que cambian la decisión están resueltas.
- [ ] La evidencia es proporcional al riesgo.
- [ ] Los trade-offs son comprendidos.
- [ ] Los riesgos tienen controles.
- [ ] La migración es viable.
- [ ] La compatibilidad está definida.
- [ ] La validación tiene criterios.
- [ ] El estado se actualizó a Aceptado.
- [ ] La fecha de decisión es correcta.
- [ ] El Pull Request fue aprobado.

---

## 40. Checklist de reemplazo

- [ ] El nuevo ADR enlaza este ADR.
- [ ] Este ADR cambia a Reemplazado.
- [ ] `Reemplazado por` contiene el nuevo número.
- [ ] El nuevo ADR declara `Reemplaza`.
- [ ] El índice marca ambos estados.
- [ ] La transición de implementaciones está documentada.
- [ ] No se borró ni reescribió la decisión original.

---

## 41. Nota final de uso

Antes de publicar una decisión real:

1. elimina todas las instrucciones;
2. elimina secciones que no apliquen;
3. conserva las secciones obligatorias;
4. verifica enlaces;
5. actualiza [README.md](README.md);
6. y solicita revisión.

> **Un ADR útil es breve donde puede serlo y preciso donde debe serlo. Su objetivo no es llenar una plantilla, sino conservar una decisión comprensible y verificable.**
