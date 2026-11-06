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
        persistence: 'deferred',
        blocker:
          'La versión vigente contempla una organización y no persiste este scope.',
      },
      {
        scope: 'plant',
        persistence: 'deferred',
        blocker:
          'La versión vigente contempla una planta y no persiste este scope.',
      },
      {
        scope: 'warehouse',
        persistence: 'available',
        blocker:
          'Los almacenes operativos se conservan, pero no se asignan a organizaciones, plantas ni permisos scoped.',
      },
    ]);
  });

  it('impide activar la migración mientras sus bloqueos sigan abiertos', () => {
    expect(AUTHORIZATION_SCOPE_SPIKE.blockers).toEqual([
      'La propuesta sucesora de ADR-0017 difiere los scopes de organización y planta; no autoriza activar autoridad incompleta.',
      'public.is_admin concede autoridad global mediante user_roles.',
      'RLS tiene 48 políticas vigentes exclusivas de is_admin y ninguna alternativa scoped.',
      'Quedan 13 políticas de escritura abiertas; su reemplazo está preparado, pero no aplicado ni probado.',
      'La aplicación vigente opera con una organización y una planta; los almacenes no tienen asignaciones de autorización scoped.',
      'Los vocabularios están unificados, pero ningún valor externo equivale a user_roles.',
      'La autoridad no se infiere: exige una fila explícita en user_roles.',
      'La evaluación dual existe solo en sombra y todavía no autoriza.',
      'Las referencias compuestas de organización/planta a almacén quedan diferidas con esa jerarquía.',
      'La denegación de scopes existe en aplicación, pero su prueba RLS todavía no se ejecutó.',
    ]);
    expect(AUTHORIZATION_SCOPE_SPIKE.roleEquivalence).toHaveLength(10);

    expect(() => assertMembershipScopeMigrationReady()).toThrow(
      /migración de membresías y scopes está bloqueada/,
    );
  });
});
