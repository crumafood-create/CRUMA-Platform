# Engineering Operating System de CRUMAFOOD Platform

> **Ingeniería con propósito. Software al servicio de las personas.**

## Estado del documento

| Campo | Valor |
|---|---|
| Estado | Propuesto para aprobación |
| Versión | 1.0 |
| Propietarios | Product Owner y responsable de arquitectura de CRUMAFOOD Platform |
| Alcance | Sistema operativo para descubrir, diseñar, implementar, verificar, entregar y mejorar software |
| Autoridad | Derivado de la Constitución y de los Principios de Ingeniería del CES |
| Revisión | Trimestralmente o cuando un incidente, retroalimentación o cambio de escala revele una mejora necesaria |

---

## 1. Propósito

El Engineering Operating System, en adelante **EOS**, define cómo trabaja la ingeniería de CRUMAFOOD Platform desde que aparece una necesidad hasta que el cambio se encuentra operando, observado y aprendido.

La Constitución del CRUMAFOOD Engineering System establece aquello que no negociamos.

Los Principios de Ingeniería establecen cómo pensamos y tomamos decisiones.

Este documento establece **cómo convertimos esos compromisos en trabajo cotidiano**.

El EOS existe para que la entrega de software sea:

- orientada a resultados reales;
- proporcional al riesgo;
- técnicamente coherente;
- verificable;
- segura;
- observable;
- documentada cuando corresponde;
- y capaz de mejorar con la experiencia.

El objetivo no es crear burocracia. El objetivo es reducir incertidumbre, evitar errores repetibles y permitir que el equipo entregue valor con disciplina sostenible.

---

## 2. Resultado esperado

Una persona que participe en CRUMAFOOD deberá poder responder con claridad:

- cómo entra una necesidad al sistema de trabajo;
- quién decide su prioridad;
- cuándo necesita diseño, RFC o ADR;
- qué condiciones debe cumplir antes de implementarse;
- cómo se desarrolla y revisa;
- qué evidencia demuestra que funciona;
- cómo llega a producción;
- cómo se observa y recupera;
- qué documentación debe actualizarse;
- y cómo se incorpora el aprendizaje obtenido.

El EOS deberá producir consistencia sin impedir el juicio profesional.

---

## 3. Relación con el CES

La jerarquía operativa es:

```text
Visión de producto
        │
Constitución del CES
        │
Principios de ingeniería
        │
Engineering Operating System
        │
Arquitectura, ADR, RFC, guías y runbooks
        │
Backlog, código, datos, despliegues y operación
```

Ningún procedimiento definido aquí podrá contradecir un documento de mayor autoridad.

Cuando una práctica del EOS deje de servir al propósito del CES, deberá modificarse de forma explícita. No deberá conservarse solamente por costumbre.

---

## 4. Principios operativos

El trabajo diario del equipo se rige por las siguientes reglas:

### 4.1 Un único flujo visible

Toda iniciativa, defecto, deuda, incidente o mejora relevante deberá tener una representación visible en el sistema de trabajo.

El trabajo oculto genera prioridades ocultas, riesgos invisibles y decisiones difíciles de revisar.

### 4.2 Responsabilidad de extremo a extremo

Quien implementa un cambio no es responsable únicamente de escribir código. También debe contribuir a que el cambio pueda comprenderse, verificarse, entregarse y operarse.

### 4.3 Proceso proporcional al riesgo

Un ajuste editorial no requiere el mismo proceso que un cambio en inventario, autorización, costos o migración de datos.

El nivel de diseño, revisión, prueba y aprobación deberá crecer con el impacto potencial.

### 4.4 Cambios pequeños e integrables

Preferimos cambios pequeños que puedan revisarse, probarse y revertirse con claridad.

Las iniciativas grandes deberán dividirse en incrementos que mantengan coherencia técnica y valor verificable.

### 4.5 Evidencia antes que confianza implícita

Una afirmación como “funciona” deberá estar respaldada por evidencia proporcional al riesgo: pruebas, revisión, resultados observables, validación de usuario o combinación de estas.

### 4.6 Automatización de lo repetible

Toda verificación frecuente, determinista y valiosa deberá automatizarse cuando su costo sea razonable.

La automatización no sustituye el juicio. Libera al equipo para utilizarlo donde aporta más valor.

### 4.7 Aprendizaje incorporado

Un error corregido sin aprendizaje incorporado permanece disponible para repetirse.

Los incidentes, defectos y fricciones recurrentes deberán traducirse en mejores controles, documentación, arquitectura o proceso.

---

# Parte I — Gobierno del trabajo

## 5. Responsabilidades

Las responsabilidades podrán ser ejercidas por una o varias personas según el tamaño del equipo. Aunque una misma persona ocupe varios roles, las decisiones y verificaciones deberán seguir siendo explícitas.

### 5.1 Product Owner

Es responsable de:

- definir el problema y el resultado de negocio esperado;
- priorizar el backlog;
- resolver dudas de alcance y comportamiento;
- aceptar o rechazar el resultado funcional;
- y equilibrar valor, urgencia y costo de oportunidad.

No prescribe necesariamente la solución técnica.

### 5.2 Responsable de arquitectura e ingeniería

Es responsable de:

- proteger la coherencia de la plataforma;
- identificar decisiones arquitectónicas;
- evaluar riesgos técnicos y operativos;
- asegurar que las dependencias respeten los límites definidos;
- aprobar excepciones relevantes;
- y facilitar la evolución del CES.

No utiliza la arquitectura para bloquear sin explicación. Toda objeción deberá expresar el riesgo y, cuando sea posible, una alternativa.

### 5.3 Responsable de módulo o capacidad

Es responsable de:

- comprender el comportamiento del módulo;
- mantener sus contratos;
- revisar cambios de alto impacto;
- cuidar su documentación y runbooks;
- y hacer visibles sus riesgos y deuda.

La propiedad de un módulo no concede permiso para ignorar contratos compartidos.

### 5.4 Persona implementadora

Es responsable de:

- comprender el trabajo antes de iniciarlo;
- diseñar la solución en el nivel requerido;
- implementar cambios claros y seguros;
- crear o actualizar verificaciones;
- mantener la documentación afectada;
- responder a la revisión con argumentos y evidencia;
- y acompañar el cambio hasta que su entrega sea estable.

### 5.5 Persona revisora

Es responsable de evaluar:

- corrección funcional;
- claridad;
- límites arquitectónicos;
- seguridad;
- integridad de datos;
- verificabilidad;
- mantenibilidad;
- y riesgos de entrega.

La revisión no debe reducirse a formato o preferencias personales.

### 5.6 Responsable de liberación

Es responsable de:

- verificar que los controles de liberación se cumplan;
- confirmar la estrategia de despliegue y recuperación;
- registrar la versión o cambio liberado;
- y supervisar las señales iniciales de producción.

### 5.7 Responsable de incidente

Durante un incidente coordina:

- clasificación de severidad;
- contención;
- comunicación;
- recuperación;
- registro de decisiones;
- y revisión posterior.

Su prioridad es restaurar una operación segura, no encontrar culpables.

---

## 6. Tipos de trabajo

Todo trabajo relevante deberá clasificarse para aplicar el flujo apropiado.

### 6.1 Iniciativa

Resultado amplio de producto o plataforma que requiere varios incrementos coordinados.

Ejemplos:

- capacidad de producción por lotes;
- migración a arquitectura multiplataforma;
- estrategia offline;
- o integración con impresoras industriales.

### 6.2 Capacidad o historia de producto

Comportamiento utilizable que genera valor directo para una persona usuaria o un proceso.

### 6.3 Defecto

Diferencia entre el comportamiento esperado y el observado.

Deberá incluir evidencia de reproducción, impacto y alcance conocido.

### 6.4 Trabajo técnico

Cambio que mejora seguridad, mantenibilidad, rendimiento, capacidad operativa o evolución sin crear necesariamente una función visible.

### 6.5 Deuda técnica

Compromiso consciente o condición heredada que incrementa el costo o riesgo de cambios futuros.

No todo código mejorable constituye deuda prioritaria. La deuda deberá relacionarse con una consecuencia observable o previsible.

### 6.6 Incidente

Interrupción o degradación en un entorno operativo que afecta disponibilidad, datos, seguridad o una capacidad crítica.

### 6.7 RFC

Propuesta de cambio significativo que requiere discusión antes de convertirse en decisión.

### 6.8 ADR

Registro de una decisión arquitectónica importante, su contexto y sus consecuencias.

### 6.9 Incremento del CES

Mejora al sistema de ingeniería: una guía, control automatizado, decisión registrada, runbook, estándar o aprendizaje incorporado.

---

## 7. Sistema único de backlog

CRUMAFOOD mantendrá un backlog visible que reúna producto, plataforma, defectos, deuda, seguridad y mejoras del CES.

Separar completamente el trabajo técnico del trabajo de producto suele ocultar costos y crear prioridades incompatibles.

Cada elemento deberá contener, como mínimo:

- título claro;
- tipo de trabajo;
- problema o necesidad;
- resultado esperado;
- propietario;
- prioridad;
- estado;
- criterios de aceptación cuando apliquen;
- riesgos conocidos;
- y vínculos con decisiones o documentación relacionada.

Los elementos no deberán permanecer indefinidamente “en progreso”. Un bloqueo deberá hacerse visible con su causa y siguiente acción.

---

## 8. Priorización

La prioridad será responsabilidad del Product Owner con asesoría técnica y operativa.

Se evaluarán, al menos:

- valor para personas usuarias y negocio;
- urgencia real;
- riesgo operativo o de seguridad;
- cumplimiento o compromiso externo;
- dependencia con otras capacidades;
- aprendizaje que desbloquea;
- costo de retraso;
- esfuerzo y complejidad;
- y efecto sobre la salud de la plataforma.

La antigüedad de una tarea no la convierte automáticamente en prioritaria.

La urgencia declarada deberá poder explicar qué consecuencia ocurre si el trabajo no se realiza ahora.

---

## 9. Política de trabajo urgente

Un elemento podrá utilizar vía urgente cuando exista:

- incidente activo;
- riesgo inmediato para datos o seguridad;
- operación crítica bloqueada;
- obligación externa con fecha no negociable;
- o pérdida material que no pueda esperar al flujo ordinario.

El trabajo urgente deberá:

1. tener un responsable explícito;
2. limitar el alcance a restaurar o proteger la operación;
3. registrar los riesgos aceptados;
4. incluir una estrategia de verificación y recuperación;
5. y generar seguimiento posterior si se omitió parte del proceso normal.

“Lo necesitamos rápido” no es suficiente para omitir controles esenciales.

---

# Parte II — Flujo de entrega

## 10. Ciclo operativo del CES

Todo cambio recorre, con profundidad proporcional a su riesgo, el siguiente ciclo:

```text
Descubrir
   │
Enmarcar
   │
Diseñar
   │
Decidir
   │
Planificar
   │
Implementar
   │
Verificar
   │
Liberar
   │
Observar
   │
Aprender
```

Las etapas pueden solaparse en cambios pequeños. No deberán omitirse de forma inconsciente.

---

## 11. Descubrir

### Objetivo

Comprender la realidad antes de definir la solución.

### Actividades posibles

- observar el proceso actual;
- conversar con personas usuarias;
- revisar datos e incidentes;
- reproducir el problema;
- identificar restricciones;
- estudiar el código y la arquitectura existentes;
- y separar síntomas de causas.

### Salidas esperadas

- problema comprendido;
- personas o procesos afectados;
- evidencia disponible;
- y preguntas abiertas visibles.

### Criterio de salida

El equipo puede explicar el problema sin comenzar por una tecnología o pantalla específica.

---

## 12. Enmarcar

### Objetivo

Convertir el aprendizaje en un resultado concreto y delimitado.

### El elemento deberá expresar

- problema;
- resultado esperado;
- alcance incluido;
- alcance excluido;
- criterios de aceptación;
- restricciones;
- riesgos iniciales;
- y forma de medir o confirmar el resultado.

### Criterio de salida

Producto e ingeniería comparten una comprensión suficiente de qué significa resolver el problema.

---

## 13. Diseñar

### Objetivo

Definir la solución más simple que proteja correctamente el dominio, los datos y la evolución.

### El diseño podrá incluir

- flujo de usuario;
- reglas e invariantes;
- estados y transiciones;
- límites de módulo;
- contratos;
- modelo de datos;
- autorización;
- efectos secundarios;
- manejo de errores;
- estrategia de migración;
- observabilidad;
- pruebas;
- liberación y recuperación.

### Criterio de salida

Los riesgos importantes se conocen y la implementación puede comenzar sin depender de decisiones esenciales ocultas.

---

## 14. Decidir

### Objetivo

Cerrar explícitamente las decisiones que no deben quedar implícitas dentro del código.

### Resultado posible

- aprobación directa para cambios locales y reversibles;
- RFC aprobado para cambios amplios que requieren discusión;
- ADR para una decisión arquitectónica significativa;
- o rechazo y rediseño cuando la propuesta no protege el producto.

### Criterio de salida

Se conocen la decisión, sus consecuencias y la autoridad que la aprobó.

---

## 15. Planificar

### Objetivo

Dividir la solución en cambios integrables, ordenados y verificables.

La planificación deberá identificar:

- secuencia de implementación;
- dependencias;
- migraciones;
- indicadores de avance;
- estrategia de pruebas;
- estrategia de liberación;
- y condiciones de rollback o recuperación.

Una iniciativa grande deberá dividirse en incrementos verticales o habilitadores que mantengan el sistema en estado coherente.

---

## 16. Implementar

### Objetivo

Convertir el diseño en software claro, seguro y mantenible.

La implementación deberá:

- respetar límites de arquitectura;
- mantener cambios enfocados;
- proteger invariantes;
- incluir manejo explícito de errores;
- evitar efectos secundarios ocultos;
- y conservar el repositorio en un estado integrable.

El código incompleto que pueda afectar usuarios deberá permanecer detrás de una protección adecuada, como una bandera de funcionalidad o una ruta inaccesible.

---

## 17. Verificar

### Objetivo

Obtener evidencia de que el cambio hace lo esperado y no introduce riesgos inaceptables.

La verificación podrá incluir:

- pruebas unitarias;
- pruebas de integración;
- pruebas de contratos;
- pruebas end-to-end;
- revisión manual dirigida;
- validación de migraciones;
- revisión de autorización;
- análisis estático;
- compilación;
- y aceptación de producto.

### Criterio de salida

La evidencia es proporcional al riesgo y los defectos conocidos se encuentran resueltos o explícitamente aceptados.

---

## 18. Liberar

### Objetivo

Poner el cambio a disposición de forma controlada y recuperable.

La liberación deberá considerar:

- dependencias de datos;
- compatibilidad entre versiones;
- configuración;
- secretos;
- migraciones;
- monitoreo inicial;
- comunicación;
- y rollback.

### Criterio de salida

El cambio está disponible para su audiencia prevista y existe evidencia de que el sistema permanece saludable.

---

## 19. Observar

### Objetivo

Confirmar el comportamiento real después de la liberación.

Se observarán, según el cambio:

- errores;
- rendimiento;
- eventos de negocio;
- trazas o registros;
- uso de la capacidad;
- retroalimentación de usuarios;
- integridad de datos;
- y señales operativas.

La ausencia de reportes no equivale automáticamente a éxito.

---

## 20. Aprender

### Objetivo

Convertir el resultado real en mejora del producto y del sistema de ingeniería.

El equipo deberá preguntar:

- ¿resolvimos el problema correcto?;
- ¿qué supuestos fueron incorrectos?;
- ¿qué defecto o fricción fue evitable?;
- ¿qué control debería automatizarse?;
- ¿qué conocimiento debe documentarse?;
- ¿qué deuda se generó?;
- y ¿qué debe cambiar en el siguiente ciclo?

El aprendizaje relevante deberá volver al backlog, a la arquitectura, al CES o al producto.

---

# Parte III — Preparación y decisiones

## 21. Definition of Ready

Un elemento está listo para implementación cuando, en el nivel requerido por su riesgo:

- el problema está explicado;
- el resultado esperado está definido;
- el alcance tiene límites comprensibles;
- los criterios de aceptación son verificables;
- las reglas de negocio relevantes están identificadas;
- las preguntas bloqueantes se resolvieron;
- las dependencias son conocidas;
- los riesgos principales son visibles;
- existe una persona responsable;
- y se conoce si requiere RFC, ADR, migración, revisión de seguridad o estrategia de liberación especial.

No se exige conocer cada detalle de implementación. Sí se exige haber reducido la incertidumbre que podría cambiar materialmente la solución.

Un defecto urgente puede entrar sin cumplir todos los puntos, pero deberá conservar evidencia mínima para evitar una corrección a ciegas.

---

## 22. Clasificación de riesgo

Cada cambio deberá clasificarse de forma proporcional.

### Riesgo bajo

Ejemplos:

- corrección de texto;
- ajuste visual sin efecto funcional;
- refactor local con pruebas existentes;
- documentación.

Controles mínimos:

- revisión adecuada;
- análisis estático aplicable;
- y verificación del comportamiento afectado.

### Riesgo medio

Ejemplos:

- nueva pantalla administrativa;
- consulta o reporte no destructivo;
- cambio localizado en un caso de uso;
- nueva integración no crítica.

Controles esperados:

- diseño breve;
- pruebas de comportamiento;
- revisión de módulo;
- y validación en entorno previo.

### Riesgo alto

Ejemplos:

- movimientos de inventario;
- costos;
- autorizaciones;
- órdenes de producción;
- cambios de esquema;
- operaciones multi-módulo;
- integraciones con efectos irreversibles.

Controles esperados:

- diseño explícito;
- revisión arquitectónica;
- pruebas de integración;
- evaluación de concurrencia e idempotencia;
- plan de migración y recuperación;
- observabilidad;
- y aprobación de liberación.

### Riesgo crítico

Ejemplos:

- autenticación central;
- exposición de datos sensibles;
- cambios destructivos masivos;
- restauración de backups;
- mecanismos financieros críticos;
- o cambios que pueden detener la operación completa.

Controles esperados:

- RFC y/o ADR cuando corresponda;
- revisión de seguridad y datos;
- ensayo de migración o recuperación;
- aprobación conjunta de producto y arquitectura;
- plan de comunicación;
- y supervisión directa durante la liberación.

La clasificación puede elevarse si el cambio es difícil de revertir, poco observable o insuficientemente comprendido.

---

## 23. Cuándo utilizar un RFC

Se deberá proponer un RFC cuando el cambio:

- afecta varios módulos o productos;
- introduce una nueva capacidad de plataforma;
- modifica un contrato público;
- implica una migración amplia;
- cambia el modelo de seguridad;
- crea dependencia tecnológica significativa;
- requiere una decisión con múltiples alternativas razonables;
- o tendrá un costo elevado de reversión.

Un RFC describe el problema, opciones, propuesta, riesgos, migración y preguntas abiertas.

El RFC permite discutir antes de comprometer la arquitectura.

---

## 24. Cuándo registrar un ADR

Se deberá registrar un ADR cuando una decisión:

- afecta la estructura o dirección de dependencias;
- establece una tecnología o proveedor relevante;
- define un patrón compartido;
- modifica límites entre módulos;
- establece una estrategia de datos, seguridad, offline o integración;
- reemplaza una decisión anterior;
- o es probable que una persona futura pregunte por qué el sistema se diseñó así.

Un ADR registra una decisión ya tomada. No sustituye la discusión previa cuando esta sea necesaria.

---

## 25. Cambios reversibles e irreversibles

Las decisiones reversibles podrán tomarse con menor ceremonia y validarse mediante uso real.

Las decisiones difíciles de revertir requerirán mayor evidencia antes de implementarse.

Se considerarán especialmente difíciles de revertir:

- formatos de datos públicos;
- contratos consumidos externamente;
- migraciones destructivas;
- dependencias de proveedor profundas;
- modelos de autorización;
- y reglas que alteran datos históricos.

Cuando exista duda, preferiremos una estrategia que conserve opciones abiertas sin agregar complejidad desproporcionada.

---

# Parte IV — Desarrollo e integración

## 26. Estrategia de ramas

La rama `main` representa el estado integrable y liberable del producto.

Se utilizarán ramas de vida corta creadas desde `main`.

Convenciones recomendadas:

```text
feature/<descripcion>
fix/<descripcion>
refactor/<descripcion>
docs/<descripcion>
chore/<descripcion>
hotfix/<descripcion>
```

Reglas:

- no se desarrollarán iniciativas completas durante semanas en una rama aislada;
- los cambios grandes se dividirán para integrarse progresivamente;
- `main` deberá permanecer protegida;
- no se realizará push directo salvo procedimiento de emergencia aprobado;
- y toda rama deberá eliminarse después de integrarse o descartarse.

La estrategia podrá evolucionar a un monorepo sin cambiar el principio de integración frecuente.

---

## 27. Commits

Los commits deberán representar unidades comprensibles de cambio.

Se recomienda utilizar mensajes consistentes:

```text
feat(inventory): add stock adjustment use case
fix(families): prevent duplicate active slug
refactor(products): isolate product repository
 docs(ces): add engineering operating system
```

Un commit deberá:

- expresar intención;
- evitar mezclar cambios no relacionados;
- y dejar el repositorio en un estado razonablemente coherente.

No se exige perfección histórica durante exploración local. Antes de integrar, la historia deberá ser suficientemente clara para revisión y diagnóstico.

---

## 28. Pull Requests

Todo cambio de código que llegue a `main` deberá pasar por una Pull Request, salvo una emergencia documentada.

Una Pull Request deberá incluir:

- problema o contexto;
- solución aplicada;
- alcance excluido;
- riesgos;
- evidencia de verificación;
- cambios de datos o configuración;
- estrategia de liberación y rollback cuando aplique;
- capturas o evidencia visual cuando cambie la interfaz;
- y vínculos con backlog, RFC, ADR o documentación.

La descripción no deberá repetir todo el código. Deberá ayudar a la persona revisora a comprender la intención y los riesgos.

---

## 29. Tamaño de Pull Requests

Las Pull Requests deberán ser lo suficientemente pequeñas para revisarse con atención.

Cuando un cambio amplio no pueda dividirse funcionalmente, se podrán utilizar PR encadenadas o etapas como:

1. contratos y tipos;
2. infraestructura sin activar;
3. caso de uso;
4. interfaz detrás de una bandera;
5. migración y activación;
6. limpieza posterior.

Una gran cantidad de líneas no es automáticamente incorrecta. Sí requiere explicar por qué el cambio no puede dividirse de manera segura.

---

## 30. Revisión de código

La revisión priorizará:

1. corrección del negocio;
2. integridad y seguridad;
3. arquitectura y límites;
4. manejo de errores;
5. verificabilidad;
6. claridad y mantenibilidad;
7. rendimiento cuando sea relevante;
8. y estilo no automatizable.

Los comentarios deberán clasificarse con claridad cuando sea útil:

- **Bloqueante:** riesgo que debe resolverse antes de integrar;
- **Importante:** mejora necesaria o pregunta no resuelta;
- **Sugerencia:** alternativa no obligatoria;
- **Pregunta:** búsqueda de contexto;
- **Detalle:** observación menor.

No se bloqueará una entrega por una preferencia estética que una herramienta puede resolver automáticamente o que no modifica calidad material.

La persona autora deberá responder cada comentario relevante mediante cambio, explicación o acuerdo explícito.

---

## 31. Aprobación

Un cambio de riesgo bajo o medio deberá contar con al menos una revisión competente cuando exista otra persona disponible.

Un cambio de riesgo alto o crítico deberá incluir revisión de la responsabilidad técnica apropiada.

Cuando el equipo sea temporalmente de una sola persona, la separación de responsabilidades se reemplazará por controles compensatorios:

- checklist explícito;
- revisión diferida antes de liberar;
- pruebas automatizadas;
- comparación contra el diseño;
- y registro de riesgos.

La ausencia de una segunda persona no elimina la necesidad de revisión; cambia su forma.

---

## 32. Integración continua

Antes de integrar, el sistema automatizado deberá ejecutar progresivamente controles como:

- formato;
- lint;
- verificación de tipos;
- pruebas unitarias;
- pruebas de integración disponibles;
- compilación;
- análisis de dependencias;
- y validaciones de migración o esquema cuando existan.

Los controles obligatorios dependerán de la madurez del repositorio, pero una falla no deberá ignorarse sin una excepción visible.

Una prueba inestable deberá corregirse o aislarse con propietario y seguimiento. No deberá normalizarse volver a ejecutar hasta obtener un resultado verde.

---

## 33. Reglas de implementación para CRUMAFOOD

### 33.1 TypeScript

- se mantendrá el modo estricto;
- se evitará `any` salvo adaptación aislada y justificada;
- los estados del dominio se representarán mediante tipos explícitos;
- y los límites externos validarán datos en tiempo de ejecución.

### 33.2 React y Next.js

- los componentes se concentrarán en presentación e interacción;
- los componentes de servidor se preferirán cuando no sea necesaria interactividad cliente;
- las Server Actions, handlers y rutas coordinarán transporte, autenticación y casos de uso;
- y la lógica crítica no vivirá únicamente dentro de componentes o hooks.

### 33.3 Supabase y PostgreSQL

- el cliente de Supabase no pertenecerá al dominio;
- la autorización se protegerá en servidor y mediante RLS cuando aplique;
- las restricciones de base de datos protegerán invariantes estructurales;
- las operaciones multi-paso críticas utilizarán transacciones o funciones atómicas;
- y las consultas directas deberán estar encapsuladas por una responsabilidad comprensible.

### 33.4 Módulos

Cada módulo deberá tender a separar:

```text
domain/
application/
infrastructure/
presentation/
```

La estructura exacta podrá ser más pequeña cuando el módulo no necesite todas las capas.

No se crearán carpetas vacías ni adaptadores ceremoniales para aparentar arquitectura.

### 33.5 Errores

- los errores de dominio deberán ser explícitos;
- los fallos externos deberán traducirse en límites de infraestructura;
- la interfaz deberá recibir errores seguros y accionables;
- y los detalles sensibles no deberán exponerse a usuarios.

### 33.6 Fechas, cantidades y dinero

- las zonas horarias deberán tratarse de forma explícita;
- las cantidades deberán incluir unidad cuando exista riesgo de ambigüedad;
- el dinero no se representará mediante operaciones de punto flotante imprecisas;
- y las conversiones deberán pertenecer a una responsabilidad definida.

### 33.7 Identidad e idempotencia

Las operaciones que puedan repetirse por reintentos, conectividad o integración deberán diseñarse para evitar efectos duplicados cuando el impacto lo justifique.

---

# Parte V — Verificación y calidad

## 34. Estrategia de pruebas

La estrategia de pruebas deberá proteger comportamientos, no perseguir métricas aisladas.

Se utilizará la combinación adecuada de:

### Pruebas unitarias

Para reglas, cálculos, políticas, transiciones y objetos de dominio.

### Pruebas de integración

Para repositorios, base de datos, RLS, servicios, transacciones e interacción entre componentes reales.

### Pruebas de contrato

Para límites entre módulos, APIs e integraciones externas.

### Pruebas end-to-end

Para flujos críticos desde la perspectiva del usuario.

### Pruebas de migración

Para cambios de esquema, transformación de datos y compatibilidad.

### Pruebas de seguridad

Para autorización, exposición de información, abuso de entradas y políticas.

### Pruebas exploratorias

Para descubrir comportamientos que los casos automatizados no anticiparon.

---

## 35. Matriz mínima por riesgo

### Riesgo bajo

- verificación local del cambio;
- controles estáticos;
- prueba existente o nueva cuando el comportamiento lo requiera.

### Riesgo medio

- pruebas del caso de uso;
- verificación de integración afectada;
- recorrido manual del flujo principal.

### Riesgo alto

- pruebas de reglas e integración;
- casos de error y concurrencia relevantes;
- validación de autorización;
- ensayo de migración;
- verificación del rollback o compensación;
- y aceptación dirigida.

### Riesgo crítico

- evidencia de todos los puntos de riesgo alto;
- revisión independiente;
- escenario de recuperación probado;
- supervisión de liberación;
- y plan explícito de respuesta.

La cobertura de líneas no sustituye esta matriz.

---

## 36. Reglas para defectos

Toda corrección de defecto deberá, cuando sea razonable:

1. reproducir el comportamiento incorrecto;
2. identificar la causa, no únicamente el síntoma;
3. agregar una verificación que falle antes de la corrección;
4. implementar el cambio mínimo seguro;
5. comprobar efectos secundarios;
6. y registrar aprendizaje cuando el defecto revele una debilidad sistémica.

Un defecto de datos deberá evaluar también si existen registros históricos afectados y cómo repararlos.

---

## 37. Definition of Done

Un elemento se considera terminado únicamente cuando cumple los criterios aplicables.

### Resultado de producto

- el comportamiento satisface los criterios de aceptación;
- el alcance se encuentra completo o explícitamente diferido;
- y el Product Owner puede validar el resultado.

### Ingeniería

- el código está integrado en la rama principal;
- los controles automatizados requeridos pasan;
- las pruebas proporcionales al riesgo existen y pasan;
- no quedan errores conocidos ocultos;
- y los límites arquitectónicos se respetan.

### Datos y seguridad

- las migraciones fueron revisadas;
- los permisos fueron verificados;
- los secretos y configuraciones se gestionan correctamente;
- y la integridad de datos está protegida.

### Operación

- existe estrategia de liberación;
- la observabilidad necesaria está disponible;
- la recuperación es posible o el riesgo está aceptado;
- y la persona responsable conoce cómo confirmar la salud del cambio.

### Conocimiento

- la documentación afectada está actualizada;
- las decisiones relevantes están registradas;
- y el backlog refleja cualquier deuda o seguimiento pendiente.

### Liberación

- el cambio está disponible para la audiencia prevista;
- y su comportamiento inicial fue observado.

“Código terminado” no equivale a “trabajo terminado”.

---

## 38. Calidad no negociable

No se liberará conscientemente un cambio que:

- permita corrupción de datos;
- omita autorización crítica;
- exponga secretos o información sensible;
- dependa de una migración no validada;
- no tenga estrategia razonable de recuperación en un flujo crítico;
- o introduzca un estado de negocio imposible sin aceptación explícita del riesgo.

La presión de tiempo puede reducir alcance. No deberá convertir un riesgo grave en invisible.

---

# Parte VI — Datos y migraciones

## 39. Cambios de esquema

Todo cambio de base de datos deberá considerar:

- compatibilidad con la versión actual de la aplicación;
- duración y bloqueo;
- volumen de datos;
- valores existentes;
- defaults;
- restricciones;
- índices;
- RLS;
- funciones y triggers relacionados;
- y recuperación.

Las migraciones deberán versionarse y ser reproducibles.

No se realizarán cambios manuales permanentes en producción sin reflejarlos en el repositorio.

---

## 40. Estrategia expandir–migrar–contraer

Cuando un cambio incompatible no pueda realizarse de forma atómica, se preferirá:

1. **Expandir:** agregar la nueva estructura de forma compatible;
2. **Migrar:** actualizar código y datos progresivamente;
3. **Verificar:** confirmar que la nueva fuente funciona;
4. **Contraer:** eliminar la estructura anterior en un cambio posterior.

La fase de contracción no deberá ejecutarse hasta comprobar que no existen consumidores activos del contrato anterior.

---

## 41. Migraciones de datos

Una migración de datos deberá definir:

- selección exacta de registros;
- transformación;
- validación previa;
- comportamiento ante errores;
- idempotencia o protección contra doble ejecución;
- auditoría de resultados;
- validación posterior;
- y estrategia de recuperación.

Cuando el volumen o riesgo sea alto, deberá ensayarse con una copia representativa antes de producción.

---

## 42. Reparaciones de datos

Una reparación de datos no deberá ejecutarse como consulta improvisada sin evidencia.

Deberá conservar:

- causa;
- registros afectados;
- script o procedimiento utilizado;
- respaldo o punto de recuperación;
- resultado;
- responsable;
- y control agregado para evitar recurrencia.

---

# Parte VII — Liberación y operación

## 43. Entornos

CRUMAFOOD deberá mantener, según su madurez:

- entorno local;
- entornos de preview por Pull Request;
- entorno de validación o staging cuando los riesgos lo justifiquen;
- y producción.

Los entornos deberán parecerse lo suficiente para detectar incompatibilidades sin utilizar datos productivos sensibles de forma insegura.

La configuración específica de entorno no deberá estar codificada de forma dispersa.

---

## 44. Checklist de liberación

Antes de una liberación relevante deberá confirmarse:

- Pull Request aprobada;
- controles automatizados exitosos;
- migraciones listas y ordenadas;
- configuración y secretos disponibles;
- permisos verificados;
- compatibilidad entre aplicación y base de datos;
- estrategia de rollback o recuperación;
- monitoreo preparado;
- comunicación necesaria;
- y responsable de observación identificado.

Una liberación de bajo riesgo podrá automatizar gran parte de esta lista.

---

## 45. Estrategias de liberación

Según el riesgo, podrá utilizarse:

- despliegue completo;
- activación mediante feature flag;
- liberación a usuarios internos;
- activación por organización o rol;
- migración progresiva;
- ejecución en sombra;
- o canary.

La estrategia deberá reducir el radio de impacto sin crear complejidad permanente innecesaria.

---

## 46. Rollback y recuperación

Todo cambio de riesgo alto o crítico deberá responder antes de liberarse:

- ¿puede revertirse el código?;
- ¿puede revertirse la base de datos?;
- ¿qué ocurre con datos creados durante la versión nueva?;
- ¿se necesita una migración compensatoria?;
- ¿cuánto tiempo existe para decidir?;
- y ¿quién ejecuta la recuperación?

No se describirá como “rollback” una acción que pierde datos sin reconocerlo explícitamente.

---

## 47. Observabilidad

Los flujos importantes deberán generar evidencia suficiente para responder:

- qué ocurrió;
- cuándo ocurrió;
- quién o qué lo inició;
- sobre qué entidad actuó;
- cuál fue el resultado;
- y por qué falló cuando corresponda.

La observabilidad podrá incluir:

- logs estructurados;
- identificadores de correlación;
- métricas técnicas;
- métricas de negocio;
- trazas;
- eventos de auditoría;
- y alertas accionables.

No se registrarán secretos, credenciales ni datos personales innecesarios.

---

## 48. Métricas y alertas

Una métrica deberá tener una pregunta asociada.

Ejemplos:

- ¿están fallando los movimientos de inventario?;
- ¿aumentó el tiempo para confirmar una orden?;
- ¿existen reintentos duplicando operaciones?;
- ¿una migración dejó registros incompletos?;
- ¿la aplicación desktop no puede sincronizar?;
- ¿los usuarios abandonan un flujo?

Una alerta deberá tener:

- condición clara;
- severidad;
- propietario;
- acción inicial;
- y vínculo a un runbook cuando el impacto lo justifique.

Las alertas que no requieren acción deberán eliminarse o convertirse en métricas informativas.

---

## 49. Runbooks

Un runbook deberá existir para operaciones críticas, poco frecuentes o sensibles.

Deberá contener:

- propósito;
- precondiciones;
- permisos requeridos;
- pasos;
- validaciones;
- señales de error;
- recuperación;
- y escalamiento.

Los runbooks deberán probarse durante ejercicios o uso real y actualizarse con el aprendizaje.

---

# Parte VIII — Incidentes

## 50. Severidad

### SEV-0 — Crítico

- riesgo activo para personas;
- exposición o pérdida grave de datos;
- compromiso de seguridad;
- o interrupción total de una operación esencial sin alternativa.

### SEV-1 — Alto

- capacidad crítica ampliamente degradada;
- errores que afectan múltiples usuarios u organizaciones;
- o riesgo significativo de integridad con contención disponible.

### SEV-2 — Medio

- función importante degradada con alternativa temporal;
- impacto limitado;
- o defecto operativo que requiere atención prioritaria.

### SEV-3 — Bajo

- impacto menor;
- comportamiento no crítico;
- o problema que puede tratarse mediante el backlog ordinario.

La severidad se basa en impacto actual, no en dificultad técnica.

---

## 51. Respuesta a incidentes

La respuesta seguirá:

```text
Detectar
   │
Clasificar
   │
Contener
   │
Comunicar
   │
Recuperar
   │
Verificar
   │
Aprender
```

Durante un incidente:

- se nombrará responsable;
- se mantendrá una línea de tiempo;
- se priorizará contención sobre perfección;
- los cambios serán pequeños y observables;
- y las decisiones críticas quedarán registradas.

La investigación profunda puede esperar hasta restaurar una operación segura.

---

## 52. Comunicación de incidentes

La comunicación deberá ser factual y útil.

Incluirá, según la audiencia:

- impacto conocido;
- estado actual;
- acciones en curso;
- alternativa temporal;
- siguiente actualización;
- y resolución cuando se alcance.

No se prometerán tiempos sin evidencia suficiente.

---

## 53. Revisión posterior

Los incidentes SEV-0 y SEV-1 requerirán una revisión posterior sin culpa.

La revisión deberá registrar:

- impacto;
- línea de tiempo;
- condiciones contribuyentes;
- detección;
- respuesta;
- qué funcionó;
- qué dificultó la recuperación;
- acciones correctivas;
- responsables;
- y fechas de seguimiento.

El objetivo no es identificar a quién culpar. Es modificar el sistema para reducir probabilidad o impacto futuro.

---

# Parte IX — Seguridad

## 54. Seguridad durante el ciclo de entrega

La seguridad se evaluará desde el diseño, no únicamente antes de liberar.

Todo cambio relevante deberá considerar:

- autenticación;
- autorización;
- validación de entradas;
- exposición de datos;
- gestión de secretos;
- abuso y reintentos;
- dependencias;
- registros;
- y recuperación.

---

## 55. Acceso mínimo

Las personas, servicios y clientes deberán recibir únicamente los permisos necesarios para su función.

Los permisos elevados deberán:

- limitarse;
- auditarse;
- revisarse periódicamente;
- y retirarse cuando dejen de ser necesarios.

Ocultar una acción en la interfaz no constituye autorización.

---

## 56. Secretos

Los secretos no deberán:

- almacenarse en el repositorio;
- incluirse en logs;
- exponerse al cliente cuando pertenecen al servidor;
- ni compartirse mediante canales informales inseguros.

Toda exposición confirmada deberá tratarse como incidente y producir rotación.

---

## 57. Dependencias

Las dependencias deberán agregarse con intención.

Antes de incorporar una dependencia relevante se evaluará:

- necesidad;
- mantenimiento;
- superficie de seguridad;
- licencia;
- tamaño e impacto;
- compatibilidad;
- y costo de sustitución.

Las vulnerabilidades deberán clasificarse por exposición real y riesgo, no únicamente por puntuación automática.

---

# Parte X — Documentación y conocimiento

## 58. Documentación como parte del cambio

La documentación afectada deberá actualizarse en la misma entrega que el comportamiento, siempre que sea posible.

Un cambio no deberá declarar terminado si deja instrucciones o arquitectura materialmente falsas.

---

## 59. Tipos de documentación

### Visión y Constitución

Definen identidad, propósito y compromisos estables.

### Principios y EOS

Definen criterios y forma de trabajo.

### Arquitectura

Describe estructura, límites, flujos y modelos actuales.

### ADR

Explica por qué se tomó una decisión significativa.

### RFC

Permite discutir una propuesta antes de decidir.

### README de módulo

Explica propósito, límites, contratos, modelo, dependencias y forma de trabajar con el módulo.

### Guía

Explica una práctica repetible.

### Runbook

Explica cómo operar o recuperar una capacidad.

### Decision Log o Journey

Conserva evolución, contexto y aprendizaje relevante.

---

## 60. Reglas de calidad documental

La documentación deberá ser:

- cercana al código o capacidad que describe;
- fácil de encontrar;
- explícita sobre su estado;
- actualizable;
- enlazada desde un índice cuando sea importante;
- y proporcional a su audiencia.

No deberá duplicarse el mismo conocimiento en múltiples lugares sin una fuente canónica.

Los diagramas deberán acompañarse de texto suficiente para comprender su intención.

---

## 61. Transferencia de conocimiento

Una capacidad no deberá depender permanentemente de una sola persona.

El equipo fomentará:

- revisiones cruzadas;
- documentación de módulos;
- sesiones breves de recorrido;
- rotación de revisión;
- y participación compartida en incidentes y liberaciones.

La documentación no reemplaza la colaboración, pero evita que la colaboración sea el único lugar donde existe el conocimiento.

---

# Parte XI — Deuda y salud técnica

## 62. Registro de deuda

La deuda relevante deberá registrarse con:

- condición actual;
- consecuencia;
- riesgo;
- área afectada;
- acción propuesta;
- propietario;
- prioridad;
- y condición de revisión.

No se utilizará “deuda técnica” como una categoría genérica para cualquier preferencia de refactorización.

---

## 63. Creación consciente de deuda

Podrá aceptarse deuda cuando:

- permita validar una hipótesis de alto valor;
- responda a una emergencia;
- reduzca un riesgo mayor;
- o sea una etapa explícita de migración.

La decisión deberá registrar:

- qué se está posponiendo;
- por qué;
- cuál es el costo esperado;
- quién será responsable;
- y cuándo se revisará.

La deuda silenciosa no está aceptada.

---

## 64. Capacidad para salud técnica

La salud técnica competirá dentro del mismo sistema de prioridades que el producto.

Se reservará capacidad de acuerdo con:

- riesgos acumulados;
- incidentes;
- velocidad de cambio;
- fricción de desarrollo;
- y objetivos próximos.

No se establecerá un porcentaje rígido como sustituto de la evaluación real.

---

## 65. Eliminación y limpieza

Toda migración, feature flag, compatibilidad temporal o solución provisional deberá tener condición de eliminación.

La limpieza posterior forma parte del cambio original y deberá permanecer visible hasta completarse.

---

# Parte XII — Cadencia y colaboración

## 66. Cadencia adaptable

El EOS no obliga a utilizar Scrum, Kanban u otra metodología específica.

El equipo mantendrá una cadencia ligera que incluya:

- revisión y priorización del backlog;
- sincronización de trabajo activo;
- revisión técnica de decisiones relevantes;
- demostración o aceptación de resultados;
- revisión de operación y calidad;
- y retrospectiva o mejora del sistema.

La frecuencia deberá adaptarse al tamaño del equipo y ritmo del producto.

---

## 67. Comunicación asíncrona primero

La información que debe conservarse deberá quedar en el backlog, Pull Request, RFC, ADR, documento o registro correspondiente.

Las reuniones se utilizarán cuando la conversación reduzca más incertidumbre que el intercambio asíncrono.

Toda reunión de decisión importante deberá producir una salida visible.

---

## 68. Trabajo en progreso

El equipo limitará el trabajo simultáneo para favorecer terminación, revisión y aprendizaje.

Iniciar más trabajo no compensa la falta de entrega.

Cuando existan demasiados elementos bloqueados o en progreso, la prioridad será desbloquear, dividir o cerrar antes de abrir nuevos frentes.

---

## 69. Demostración y aceptación

Cada incremento de producto deberá demostrarse o ponerse a disposición para validación de la audiencia apropiada.

La demostración deberá mostrar el comportamiento real, no únicamente código o capturas estáticas.

La aceptación registrará:

- resultado;
- observaciones;
- alcance diferido;
- y seguimiento necesario.

---

## 70. Retrospectiva

El equipo revisará periódicamente:

- qué ayudó a entregar;
- qué generó fricción;
- qué riesgo se ignoró;
- qué defecto se repitió;
- qué proceso debe eliminarse;
- y qué mejora concreta se probará.

Una retrospectiva sin acción no produce mejora.

Las acciones deberán tener propietario y seguimiento.

---

# Parte XIII — Métricas

## 71. Principio de medición

Las métricas sirven para comprender y mejorar el sistema. No deberán utilizarse para castigar personas ni fomentar comportamiento artificial.

No se medirá productividad mediante líneas de código, cantidad de commits o horas conectadas.

---

## 72. Métricas de flujo

Podrán observarse:

- tiempo desde listo hasta producción;
- tiempo de revisión;
- trabajo en progreso;
- elementos bloqueados;
- frecuencia de liberación;
- y tamaño de cambios.

Su propósito es detectar fricción, no exigir velocidad ciega.

---

## 73. Métricas de calidad y confiabilidad

Podrán observarse:

- defectos escapados;
- tasa de cambios con fallo;
- tiempo de recuperación;
- incidentes por severidad;
- pruebas inestables;
- vulnerabilidades abiertas;
- y errores de flujos críticos.

---

## 74. Métricas de producto y operación

Según el módulo, se observarán resultados como:

- reducción de diferencias de inventario;
- disminución de desperdicio por caducidad;
- tiempo para completar una operación;
- exactitud de trazabilidad;
- errores de captura;
- adopción de capacidades;
- y satisfacción de usuarios.

La entrega técnica deberá conectarse, cuando sea posible, con un resultado de producto u operación.

---

## 75. Métricas de mantenibilidad y aprendizaje

Podrán observarse:

- tiempo para incorporar a una persona al módulo;
- dependencias circulares;
- deuda vencida de alto riesgo;
- documentación obsoleta detectada;
- acciones de incidentes completadas;
- y frecuencia de cambios repetidos en la misma zona por falta de claridad.

---

# Parte XIV — Incremento del CES

## 76. Definición

Cada ciclo de entrega deberá evaluar si el trabajo produjo conocimiento o una mejora que deba incorporarse al CES.

Un incremento del CES puede ser:

- ADR;
- RFC;
- actualización de arquitectura;
- guía;
- runbook;
- plantilla;
- control automatizado;
- mejora de observabilidad;
- prueba de regresión;
- o actualización de un principio operativo.

No se crearán documentos para cumplir una cuota.

---

## 77. Criterio de incorporación

El aprendizaje deberá incorporarse cuando:

- evita repetir una decisión;
- reduce riesgo;
- facilita operación;
- aclara un límite;
- mejora onboarding;
- o convierte una práctica manual frecuente en una capacidad sostenible.

---

# Parte XV — Excepciones y evolución

## 78. Excepciones al EOS

Una práctica podrá omitirse temporalmente cuando el costo de seguirla sea desproporcionado al riesgo o exista una emergencia real.

La excepción deberá registrar:

- práctica afectada;
- contexto;
- motivo;
- riesgo aceptado;
- controles compensatorios;
- responsable;
- y fecha o condición de revisión.

No podrán omitirse silenciosamente controles fundamentales de seguridad, integridad o responsabilidad.

---

## 79. Cambios de emergencia

Durante una emergencia se podrá reducir el proceso a:

1. proteger personas, operación y datos;
2. limitar el cambio;
3. verificar el efecto esencial;
4. mantener capacidad de recuperación;
5. comunicar;
6. y registrar seguimiento posterior.

Después de la emergencia deberán completarse los controles y documentación que sigan siendo necesarios.

---

## 80. Evolución del EOS

Este documento deberá evolucionar por evidencia.

Podrá modificarse cuando:

- una práctica genere fricción sin proteger un riesgo real;
- un incidente demuestre una omisión;
- el tamaño del equipo cambie;
- la plataforma incorpore nuevos productos;
- o la automatización permita simplificar controles.

Toda modificación deberá explicar:

- problema observado;
- comportamiento actual;
- cambio propuesto;
- efecto esperado;
- riesgos;
- y documentos relacionados.

---

## 81. Aprobación y versionado

La versión inicial y los cambios materiales requieren aprobación del Product Owner y de la responsabilidad de arquitectura e ingeniería.

El versionado seguirá:

- parche: correcciones editoriales sin cambio de comportamiento;
- menor: nuevas prácticas compatibles o aclaraciones;
- mayor: cambios significativos en el sistema operativo de ingeniería.

---

# Apéndice A — Plantilla mínima de elemento de trabajo

```markdown
# Título

## Tipo
Capacidad | Defecto | Trabajo técnico | Deuda | Incidente | CES

## Problema
¿Qué ocurre y por qué importa?

## Resultado esperado
¿Qué deberá ser diferente?

## Alcance incluido
- ...

## Alcance excluido
- ...

## Criterios de aceptación
- [ ] ...

## Riesgos
- ...

## Dependencias
- ...

## Decisiones relacionadas
- RFC-...
- ADR-...

## Evidencia de terminación
- ...
```

---

# Apéndice B — Plantilla de Pull Request

```markdown
## Problema o contexto

## Solución

## Alcance excluido

## Riesgo
Bajo | Medio | Alto | Crítico

## Evidencia
- [ ] Lint
- [ ] Typecheck
- [ ] Pruebas
- [ ] Build
- [ ] Verificación manual

## Datos y seguridad
- ¿Cambia esquema o datos?
- ¿Cambia permisos o RLS?
- ¿Agrega secretos o configuración?

## Liberación
- Estrategia:
- Monitoreo:
- Rollback o recuperación:

## Documentación y decisiones
- [ ] Documentación actualizada
- [ ] ADR/RFC enlazado cuando aplica

## Capturas o evidencia visual
```

---

# Apéndice C — Checklist de diseño

```markdown
- [ ] El problema está comprendido.
- [ ] El resultado esperado es verificable.
- [ ] Las reglas e invariantes están identificadas.
- [ ] El módulo propietario está definido.
- [ ] Los contratos son explícitos.
- [ ] Se evaluaron autorización y datos sensibles.
- [ ] Se evaluaron errores, concurrencia e idempotencia.
- [ ] Se definió la estrategia de pruebas.
- [ ] Se definieron observabilidad y auditoría necesarias.
- [ ] Se evaluó migración y compatibilidad.
- [ ] Se definió liberación y recuperación.
- [ ] Se determinó si requiere RFC o ADR.
```

---

# Apéndice D — Checklist de Definition of Done

```markdown
## Producto
- [ ] Criterios de aceptación cumplidos.
- [ ] Resultado validado por la responsabilidad adecuada.

## Ingeniería
- [ ] Código revisado e integrado.
- [ ] Lint, tipos, pruebas y build exitosos.
- [ ] Casos de error relevantes verificados.

## Datos y seguridad
- [ ] Migraciones revisadas y probadas.
- [ ] Permisos y RLS verificados.
- [ ] No se exponen secretos ni datos innecesarios.

## Operación
- [ ] Observabilidad disponible.
- [ ] Rollback o recuperación definidos.
- [ ] Cambio observado después de liberar.

## Conocimiento
- [ ] Documentación actualizada.
- [ ] ADR/RFC registrado cuando aplica.
- [ ] Deuda y seguimiento visibles.
```

---

# Apéndice E — Plantilla de revisión de incidente

```markdown
# Incidente

## Severidad
SEV-0 | SEV-1 | SEV-2 | SEV-3

## Resumen

## Impacto

## Línea de tiempo

## Detección

## Contención y recuperación

## Condiciones contribuyentes

## Qué funcionó

## Qué dificultó la respuesta

## Acciones
| Acción | Responsable | Fecha | Estado |
|---|---|---|---|

## Aprendizaje incorporado al CES
```

---

# Compromiso operativo

Quien participe en la ingeniería de CRUMAFOOD se compromete a:

> hacer visible el trabajo;
>
> comprender el problema antes de implementarlo;
>
> aplicar proceso proporcional al riesgo;
>
> integrar cambios pequeños y verificables;
>
> proteger datos, permisos y reglas del negocio;
>
> revisar con respeto y evidencia;
>
> liberar de forma observable y recuperable;
>
> aprender de defectos e incidentes;
>
> y dejar el sistema de trabajo mejor preparado para la siguiente entrega.

---

# Declaración final

El Engineering Operating System no existe para producir más tareas, reuniones o documentos.

Existe para que CRUMAFOOD pueda convertir ideas en software útil sin perder claridad, confianza ni capacidad de evolución.

Un buen sistema de ingeniería no elimina todos los errores. Hace que los errores importantes sean menos probables, más visibles, más recuperables y más útiles para aprender.

> **Descubrimos antes de definir. Diseñamos antes de comprometer. Verificamos antes de confiar. Observamos después de liberar. Y aprendemos antes de repetir.**
