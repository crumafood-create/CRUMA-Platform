import { LEGACY_AUTHORIZATION_BOUNDARY } from './legacy-authorization-boundary';
import { ROLE_VOCABULARY_EQUIVALENCE } from './role-vocabulary-equivalence';

/**
 * Spike de membresía y scopes.
 *
 * Registra la evidencia verificada el 2026-10-02 y el contrato mínimo
 * que una migración futura deberá cumplir. No autoriza lecturas ni
 * escrituras sobre tenants, membresías o permisos administrativos.
 */

export const AUTHORIZATION_SPIKE_EVIDENCE_DATE = '2026-10-02' as const;

export const AUTHORIZATION_AUTHORITIES = [
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
] as const;

export type AuthorizationAuthority =
  (typeof AUTHORIZATION_AUTHORITIES)[number];

export const MEMBERSHIP_SCOPE_TARGETS = [
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
] as const;

export type MembershipScopeTarget =
  (typeof MEMBERSHIP_SCOPE_TARGETS)[number];

export const AUTHORIZATION_SPIKE_BLOCKERS = [
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
] as const;

/**
 * Las asignaciones futuras serán aditivas: no habrá reglas deny
 * ni precedencia oculta en el primer modelo.
 */
export type FutureMembershipAssignment = {
  readonly tenantId: string;
  readonly actorId: string;
  readonly permission: string;
  readonly scope:
    | { readonly type: 'organization'; readonly organizationId: string }
    | { readonly type: 'plant'; readonly plantId: string }
    | { readonly type: 'warehouse'; readonly warehouseId: string };
};

export type AuthorizationSpikeDecision = 'blocked';

export type AuthorizationScopeSpike = {
  readonly evidenceDate: typeof AUTHORIZATION_SPIKE_EVIDENCE_DATE;
  readonly decision: AuthorizationSpikeDecision;
  readonly currentBoundary: typeof LEGACY_AUTHORIZATION_BOUNDARY;
  readonly authorities: readonly AuthorizationAuthority[];
  readonly scopeTargets: readonly MembershipScopeTarget[];
  readonly roleEquivalence: typeof ROLE_VOCABULARY_EQUIVALENCE;
  readonly blockers: readonly string[];
};

export const AUTHORIZATION_SCOPE_SPIKE = {
  evidenceDate: AUTHORIZATION_SPIKE_EVIDENCE_DATE,
  decision: 'blocked',
  currentBoundary: LEGACY_AUTHORIZATION_BOUNDARY,
  authorities: AUTHORIZATION_AUTHORITIES,
  scopeTargets: MEMBERSHIP_SCOPE_TARGETS,
  roleEquivalence: ROLE_VOCABULARY_EQUIVALENCE,
  blockers: AUTHORIZATION_SPIKE_BLOCKERS,
} as const satisfies AuthorizationScopeSpike;

export function assertMembershipScopeMigrationReady(
  spike: AuthorizationScopeSpike = AUTHORIZATION_SCOPE_SPIKE,
): void {
  if (spike.decision !== 'blocked') {
    return;
  }

  throw new Error(
    'La migración de membresías y scopes está bloqueada: ' +
      spike.blockers.join(' '),
  );
}
