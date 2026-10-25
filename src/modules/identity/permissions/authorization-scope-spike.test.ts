import { describe, expect, it } from 'vitest';

import { LEGACY_AUTHORIZATION_BOUNDARY } from './legacy-authorization-boundary';
import {
  assertMembershipScopeMigrationReady,
  AUTHORIZATION_SCOPE_SPIKE,
} from './authorization-scope-spike';

describe('spike de membresía y scopes', () => {
  it('mantiene user_roles como única autoridad efectiva', () => {
    expect(AUTHORIZATION_SCOPE_SPIKE.decision).toBe('blocked');
    expect(AUTHORIZATION_SCOPE_SPIKE.currentBoundary).toBe(
      LEGACY_AUTHORIZATION_BOUNDARY,
    );
    expect(AUTHORIZATION_SCOPE_SPIKE.authorities).toEqual([
      {
        id: 'legacy-user-roles',
        relation: 'public.user_roles',
        status: 'effective',
        decision: 'Conservar hasta completar la migración dual.',
      },
      {
        id: 'tenant-membership',
        relation: 'public.tenant_members',
        status: 'present-but-unused',
        decision: 'No promover a autoridad hasta existir scopes reales.',
      },
      {
        id: 'direct-admin-permissions',
        relation: 'public.user_admin_permissions',
        status: 'present-but-unused',
        decision: 'Retirar cuando cada permiso tenga rol y scope.',
      },
      {
        id: 'profile-role',
        relation: 'public.profiles.role',
        status: 'conflicting',
        decision: 'Excluir permanentemente de la autorización.',
      },
    ]);
  });

  it('no simula organización, planta ni almacén scoped', () => {
    expect(AUTHORIZATION_SCOPE_SPIKE.scopeTargets).toEqual([
      {
        scope: 'organization',
        persistence: 'available',
        blocker: 'public.organizations existe, pero todavía no autoriza.',
      },
      {
        scope: 'plant',
        persistence: 'available',
        blocker: 'public.plants existe, pero todavía no autoriza.',
      },
      {
        scope: 'warehouse',
        persistence: 'optional',
        blocker:
          'public.warehouses puede referenciar tenant y planta, pero las filas actuales siguen globales.',
      },
    ]);
  });

  it('impide activar la migración mientras sus bloqueos sigan abiertos', () => {
    expect(AUTHORIZATION_SCOPE_SPIKE.blockers).toEqual([
      'ADR-0017 acepta la dirección, pero no autoriza activar la autoridad incompleta.',
      'public.is_admin concede autoridad global mediante user_roles.',
      'RLS tiene 50 políticas vigentes exclusivas de is_admin y ninguna alternativa scoped.',
      'Quedan 13 políticas de escritura abiertas; su reemplazo está preparado, pero no aplicado ni probado.',
      'La jerarquía existe, pero los almacenes actuales siguen sin asignación explícita.',
      'Los vocabularios están unificados, pero ningún valor externo equivale a user_roles.',
      'La autoridad no se infiere: exige una fila explícita en user_roles.',
      'La evaluación dual existe solo en sombra y todavía no autoriza.',
      'Las claves compuestas existen, pero su prueba SQL de cruce todavía no se ejecutó.',
      'La denegación de scopes existe en aplicación, pero su prueba RLS todavía no se ejecutó.',
    ]);
    expect(AUTHORIZATION_SCOPE_SPIKE.roleEquivalence).toHaveLength(10);

    expect(() => assertMembershipScopeMigrationReady()).toThrow(
      /migración de membresías y scopes está bloqueada/,
    );
  });
});
