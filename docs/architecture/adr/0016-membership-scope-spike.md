# ADR-0016: Bloquear la migración de membresías hasta resolver scopes y autoridades

> **Evidencia deprecada:** el bloqueo documental fue reemplazado por ADR-0017. El contrato ejecutable conserva los bloqueos físicos y `user_roles` sigue siendo la única autoridad efectiva.

## Metadata

| Campo               | Valor                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Estado              | Deprecado                                                                                               |
| Fecha               | 2026-10-02                                                                                              |
| Decisores           | Product Owner, responsable de arquitectura, responsable de seguridad y responsable de Identity & Access |
| Consultados         | Responsable de datos y responsables de Inventory, Warehouse y Production                                |
| Informados          | Desarrollo, calidad y soporte                                                                           |
| Propietario         | Identity & Access con corresponsabilidad de Datos y Seguridad                                           |
| Alcance             | Autoridades de autorización, membresías, scopes, RLS y migración futura                                 |
| Reemplaza           | No aplica                                                                                               |
| Reemplazado por     | ADR-0017                                                                                                |
| RFC relacionado     | No aplica                                                                                               |
| Issues relacionados | ADR-0001, ADR-0003 y el contrato `AUTHORIZATION_SCOPE_SPIKE`                                            |

---

## 1. Resumen ejecutivo

El primer incremento congeló el puente legacy. El siguiente paso era comprobar si las tablas de tenant ya podían sostener membresías y scopes sin convertir una estructura incompleta en autoridad.

La evidencia del esquema versionado no lo permite. ADR-0017 ya reemplazó la condición documental; la evidencia física conserva esta conclusión:

> **CRUMAFOOD no migrará autorización a `tenant_members` ni a permisos directos hasta unificar los vocabularios de rol y persistir una jerarquía real de organización, planta y almacén.**

---

## 2. Contexto

El baseline `20260802000000_schema_baseline.sql` contiene cuatro representaciones simultáneas:

| Representación                  | Vocabulario                          | Uso verificado                         |
| ------------------------------- | ------------------------------------ | -------------------------------------- |
| `public.user_roles`             | `admin`, `customer`                  | Autoridad efectiva de aplicación y RLS |
| `public.tenant_members`         | `owner`, `admin`, `member`, `viewer` | Presente, sin consumidores en `src/`   |
| `public.user_admin_permissions` | Permisos directos por usuario        | Presente, sin consumidores en `src/`   |
| `public.profiles.role`          | `client`, `admin`, `b2b`             | Perfil de negocio, no autorización     |

`public.is_admin(uuid)` concede acceso global cuando existe una fila `user_roles.role = 'admin'`. Las políticas operativas endurecidas dependen de esa función.

Los scopes ya pueden persistirse sin cambiar la autoridad:

- `public.organizations` pertenece a un tenant;
- `public.plants` pertenece a una organización del mismo tenant;
- `public.warehouses` puede referenciar tenant y planta, pero el vínculo es opcional;
- las filas actuales de almacén siguen globales hasta un backfill explícito.

---

## 3. Problema

Activar ahora el modelo propuesto atribuiría aislamiento a tablas que no pueden expresarlo.

En particular, podría:

- tratar una membresía de tenant como permiso sobre todos los almacenes;
- hacer convivir tres definiciones distintas de administrador;
- crear una segunda autoridad además de `is_admin`;
- y obligar después a una migración de seguridad con sesiones ya emitidas.

---

## 4. Alcance

Esta decisión cubre:

- la autoridad efectiva durante el spike;
- los bloqueos que impiden la migración;
- el contrato ejecutable que conserva esos bloqueos;
- y las condiciones mínimas para un prototipo posterior.

Esta decisión no cubre:

- aceptar ADR-0001 o ADR-0003;
- crear organizaciones, plantas o almacenes scoped;
- modificar RLS o `is_admin`;
- backfill de membresías;
- y revocación de sesiones.

---

## 5. Decisión propuesta

Se conserva el comportamiento actual:

1. `user_roles` permanece como única autoridad efectiva.
2. `tenant_members` y `user_admin_permissions` no se consultan para autorizar.
3. `profiles.role` queda excluido permanentemente de autorización.
4. Los scopes `organization`, `plant` y `warehouse` siguen registrados como deuda, no como filtros simulados.
5. El intento de declarar la migración como lista debe fallar mientras el spike permanezca `blocked`.

El contrato vive en:

```text
src/modules/identity/permissions/authorization-scope-spike.ts
```

---

## 6. Consecuencias

### Positivas

- no se introduce una frontera de seguridad falsa;
- la deuda queda ejecutable y visible para el equipo;
- cada autoridad tiene una disposición explícita;
- y la autorización productiva no cambia.

### Negativas

- varias plantas seguirán compartiendo el administrador global;
- el trabajo de WMS no podrá aislar permisos por almacén todavía;
- y el modelo objetivo permanece bloqueado por decisiones previas.

### Trabajo posterior

Antes de retirar `blocked`, ADR-0017 exige demostrar:

1. la jerarquía persistida y referenciable;
2. una matriz de equivalencia entre los cuatro vocabularios;
3. evaluación dual sin ampliar privilegios;
4. RLS que no dependa exclusivamente de `is_admin`;
5. y pruebas de denegación para organización, planta y almacén.

---

## 7. Verificación

La prueba `authorization-scope-spike.test.ts` debe fallar si:

- cambia la autoridad efectiva;
- desaparece uno de los bloqueos sin una decisión que lo resuelva;
- o se simula persistencia para un scope ausente.

Esta propuesta no autoriza por sí sola cambios de esquema.
