# ADR-0018: Diferir la persistencia de organización y planta

> **Estado:** Propuesto. Sucesión parcial de ADR-0017; requiere aceptación antes de reemplazarlo en el alcance indicado.

## Metadata

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 2026-11-06 |
| Decisores | Product Owner de CRUMAFOOD Platform |
| Consultados | Arquitectura, Identity & Access, Datos y Seguridad |
| Informados | Desarrollo, calidad y soporte |
| Propietario | Identity & Access con corresponsabilidad de Datos y Seguridad |
| Alcance | Persistencia inmediata de organización y planta, asignación de almacenes y scopes diferidos en esta versión |
| Reemplaza | Parcialmente ADR-0017 respecto a la persistencia inmediata de organización y planta y su asignación a almacenes; conserva las restantes decisiones de autorización, incluida `user_roles` como única autoridad efectiva |
| Reemplazado por | No aplica |
| RFC relacionado | No aplica |
| Issues relacionados | BD-01 |

## 1. Resumen ejecutivo

La operación vigente de CRUMAFOOD contempla una organización y una planta. No se ha identificado un flujo operativo que consuma `organizations`, `plants` ni la asignación de `warehouses` a tenant/planta. La autorización productiva sigue siendo global mediante `public.user_roles`.

La decisión propuesta es:

> **Diferir la persistencia y autorización de scopes de organización y planta; conservar los almacenes operativos y la autorización global existente hasta que un caso de uso aprobado requiera otra frontera.**

## 2. Contexto y problema

ADR-0017 aceptó tenant técnico y scopes jerárquicos como dirección futura, y la migración `20261002140000` añadió tablas y referencias opcionales sin activar su uso para autorizar. La revisión del código no encontró lecturas operativas de esos objetos o columnas. Las rutas y operaciones actuales usan `warehouses` por sus identificadores y conservan `user_roles` como autoridad.

La consulta de solo lectura al proyecto Supabase confirmó que `organizations`, `plants`, `warehouses.tenant_id` y `warehouses.plant_id` no existen allí. El repositorio sí conserva la migración histórica, pruebas y tipos que representan la jerarquía. El cambio debe mantener una reconstrucción reproducible sin presentar una migración no aplicada como si lo estuviera.

## 3. Decisión propuesta

1. La versión actual trata CRUMAFOOD como una sola organización y una sola planta, sin exigir registros persistidos para ellas.
2. `public.warehouses` permanece como entidad operativa. No tendrá referencias `tenant_id` ni `plant_id` mientras no exista un consumidor aprobado.
3. `public.tenants`, `public.tenant_members` y `public.user_roles` no se modifican mediante este cambio. `user_roles` continúa siendo la única autoridad efectiva.
4. La migración histórica `20261002140000` se conserva. Una migración posterior retira expresamente las tablas, columnas, restricciones, índices y políticas que introdujo.
5. Esa migración bloquea las tablas durante su comprobación y falla antes de borrar si encuentra filas de organización/planta o asignaciones de warehouse. No usa `CASCADE`.
6. La eventual activación de otros scopes permanece bloqueada. Requiere un caso de uso aprobado y una decisión sucesora; no se implementa gestión de sucursales o franquicias por anticipado.
7. Esta sucesión parcial no reemplaza las restantes decisiones de ADR-0017: se conserva el tenant técnico como concepto, `public.user_roles` como única autoridad efectiva y la prohibición de autorizar mediante `profiles.role` o membresías. La autorización scoped no queda activada.

## 4. Alcance y exclusiones

Esta decisión cubre la persistencia de la jerarquía descrita, su historial de migraciones, sus referencias en tipos y pruebas, y la conservación de la autorización actual.

No cubre eliminación o modificación de tenants, membresías, almacenes, datos operativos, permisos globales ni migraciones de materias primas. Tampoco activa multi-tenancy productivo.

## 5. Alternativas

| Alternativa | Resultado |
|---|---|
| Mantener las tablas y columnas sin consumidor | Conserva dependencia de esquema y prueba que contradicen la operación acordada. |
| Editar o borrar `20261002140000` | Hace ambigua la reconstrucción y puede romper entornos que ya ejecutaron ese historial. |
| Añadir una migración correctiva con guardas | Conserva el historial, deja el esquema final alineado y detiene la eliminación si hay datos. **Propuesta elegida.** |

## 6. Consecuencias y verificación

- Una reconstrucción limpia ejecutará la migración histórica y después su compensación; el estado final no contendrá la jerarquía diferida.
- El entorno remoto que aún no registra `20261002140000` no recibirá una reparación ficticia: la aplicaría por orden y luego ejecutaría la compensación. La migración correctiva fallará si encuentra datos que requieran disposición.
- CI debe probar el estado final, la autorización mediante `user_roles`, las operaciones de almacén, RLS de inventario y los tipos generados.
- La evidencia remota y las verificaciones locales se registran por separado. Esta propuesta no autoriza `migration repair`, `db push`, commit ni publicación.

## 7. Estado de la decisión

Este ADR permanece como propuesta; ADR-0017 conserva su autoridad salvo el alcance parcial que se acepte expresamente aquí. Puede publicarse una propuesta de PR para revisión y validación en CI. La fusión requiere aceptación de este ADR y las verificaciones acordadas. La aplicación remota y la reparación del historial requieren autorización independiente.

La migración correctiva depende de que `20261002140000_add_operational_scope_hierarchy.sql` se haya ejecutado antes. Su `LOCK TABLE` falla si las tablas históricas no existen; las comprobaciones posteriores con `to_regclass` no eliminan esa dependencia. Por ello, no debe ejecutarse directamente sobre el entorno remoto actual mientras falte la migración histórica.

La migración no contiene control transaccional explícito ni la directiva `-- pg-delta: transaction=false`. El flujo de CI ejecuta `supabase db reset`; [la documentación de Supabase](https://supabase.com/docs/guides/local-development/cli-workflows) indica que `db reset`, `db push` y `migration up` ejecutan sin transacción envolvente solo cuando esa directiva está presente. La integración de ramas también ejecuta cada archivo dentro de una transacción ([documentación](https://supabase.com/docs/guides/deployment/branching/github-integration)). Así, el bloqueo, las comprobaciones y los `DROP` se revierten juntos ante un error. No se debe añadir un `BEGIN` anidado.

La validación debe cubrir (a) retiro exitoso con tablas de jerarquía vacías y almacenes existentes, y (b) rechazo ante filas de organizaciones, plantas o asignaciones a almacenes, comprobando que no quede ninguna eliminación parcial. La reconstrucción limpia, las pruebas de estado/RLS y la regeneración completa de tipos siguen pendientes mientras Docker no esté disponible.
