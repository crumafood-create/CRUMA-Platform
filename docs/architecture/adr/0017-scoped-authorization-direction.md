# ADR-0017: Adoptar tenant técnico y RBAC scoped sin activar la autoridad incompleta

> **Decisión:** reemplazar ADR-0001 y ADR-0003 por una dirección vigente de tenant técnico y RBAC con scopes, conservando `user_roles` como única autoridad efectiva hasta que exista una jerarquía persistida y una evaluación dual que no amplíe privilegios.

## Metadata

| Campo               | Valor                                                                                |
| ------------------- | ------------------------------------------------------------------------------------ |
| Estado              | Aceptado                                                                             |
| Fecha               | 2026-10-02                                                                           |
| Decisores           | Product Owner de CRUMAFOOD Platform                                                  |
| Consultados         | Arquitectura, Identity & Access, Datos y Seguridad                                   |
| Informados          | Desarrollo, calidad y soporte                                                        |
| Propietario         | Identity & Access con corresponsabilidad de Datos y Seguridad                        |
| Alcance             | Dirección de tenant, autorización, membresías, scopes y migración futura             |
| Reemplaza           | ADR-0001 y ADR-0003                                                                  |
| Reemplazado por     | No aplica                                                                            |
| RFC relacionado     | ADR-0016                                                                             |
| Issues relacionados | Contrato `AUTHORIZATION_SCOPE_SPIKE` y baseline `20260802000000_schema_baseline.sql` |

---

## 1. Resumen ejecutivo

El Product Owner aceptó el 2026-10-02 reemplazar las propuestas anteriores cuando el trabajo nuevo lo hiciera necesario.

Esa aceptación resuelve el bloqueo documental, no el bloqueo físico. La migración `20261002140000` ya puede representar organización y planta dentro del tenant; el almacén sigue siendo opcional y las filas actuales permanecen globales.

La decisión vigente es:

> **CRUMAFOOD adopta Tenant como frontera técnica y RBAC con permisos canónicos y scopes jerárquicos como modelo objetivo. La autorización productiva permanece en `public.user_roles` hasta persistir la jerarquía, unificar los vocabularios y demostrar denegación sin ampliar privilegios.**

---

## 2. Contexto

ADR-0001 proponía aislamiento lógico por `tenant_id` y RLS. ADR-0003 proponía membresías, roles y scopes jerárquicos. Ambos permanecían propuestos y condicionaban el spike de ADR-0016.

La evidencia verificada el 2026-10-02 muestra:

- `public.tenants` y `public.tenant_members` existen, pero no son autoridad;
- `public.user_roles` y `public.is_admin(uuid)` conceden acceso global;
- `public.user_admin_permissions` no tiene consumidores en `src/`;
- `public.profiles.role` usa otro vocabulario;
- `public.organizations` y `public.plants` quedan persistidas dentro del tenant;
- y `public.warehouses` puede referenciarlas, pero sus filas actuales siguen globales hasta un backfill explícito.

Aceptar literalmente las propuestas anteriores autorizaría a tratar como completa una frontera que el esquema no puede expresar.

---

## 3. Decisión

Se acepta la dirección y se rechaza su activación prematura:

1. Tenant sigue siendo la frontera técnica. Organización, planta y almacén son scopes de negocio contenidos por esa frontera.
2. El modelo objetivo es RBAC: permisos canónicos, roles que agrupan permisos y asignaciones aditivas dentro de un scope.
3. La ausencia de un grant aplicable deniega. La primera versión no usa `explicit deny`.
4. `public.profiles.role` nunca autoriza.
5. `public.tenant_members` y `public.user_admin_permissions` no se consultan para autorizar.
6. `public.user_roles` permanece como única autoridad efectiva y solo mediante una fila explícita; un rol homónimo no la crea.
7. No se aceptará `tenant_id` enviado por el cliente como prueba de pertenencia.
8. No se simularán scopes mediante filtros de interfaz.

---

## 4. Qué reemplaza

Este ADR reemplaza ADR-0001 y ADR-0003 como autoridad para trabajo nuevo.

Conserva sus objetivos:

- esquema compartido;
- `tenant_id` como clave técnica;
- RLS fail-closed;
- permisos `<resource>.<action>`;
- y evaluación en caso de uso y PostgreSQL.

Sustituye la suposición de que esas propuestas ya podían implementarse sobre el esquema actual. También sustituye la jerarquía de sucursal por la jerarquía operativa verificada como necesaria: organización, planta y almacén.

---

## 5. Qué no autoriza

La migración `20261002140000` ya persistió la jerarquía. Esta decisión sigue sin autorizar:

- usar organización, planta o almacén para autorizar;
- modificar `public.is_admin` o las políticas que dependen de él;
- hacer backfill de almacenes o membresías;
- retirar `blocked` del spike;
- ni declarar multi-tenancy productivo.

---

## 6. Condiciones para activar la migración

Una decisión sucesora podrá retirar el bloqueo solo cuando existan, al mismo tiempo:

1. las filas existentes de `warehouses` asignadas explícitamente a tenant y planta;
2. constraints de cruce verificadas en PostgreSQL; las claves compuestas ya existen, pero su prueba SQL todavía no se ejecutó;
3. una matriz de equivalencia que una los cuatro vocabularios sin ampliar `user_roles`; la lectura unificada existe, pero ningún valor externo autoriza;
4. evaluación dual productiva que nunca conceda más que `user_roles`; la evaluación actual permanece en sombra y no decide;
5. RLS que no dependa exclusivamente de `is_admin`; el inventario vigente encuentra 50 políticas exclusivas, ninguna combinada con tenant, y 13 escrituras abiertas cuyo reemplazo está preparado pero no probado;
6. y pruebas de denegación para organización, planta y almacén; la denegación de aplicación existe, pero RLS todavía no fue probada.

Hasta entonces, `assertMembershipScopeMigrationReady()` debe fallar.

---

## 7. Consecuencias

La dirección deja de depender de dos ADR propuestos, pero el administrador global continúa cruzando plantas y almacenes. Ese es un riesgo conocido y aceptado temporalmente; ocultarlo con membresías incompletas sería un riesgo mayor.

ADR-0016 permanece como evidencia del spike. Su estado pasa a Deprecado porque su condición documental fue reemplazada, aunque sus bloqueos físicos siguen vigentes mediante este ADR y el contrato ejecutable.
