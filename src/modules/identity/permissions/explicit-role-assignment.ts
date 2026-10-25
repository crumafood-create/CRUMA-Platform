import {
  LEGACY_ROLES,
  type LegacyRole,
} from '@/modules/identity/legacy-role-contract';

/**
 * Asignación explícita de autoridad.
 *
 * Un rol efectivo solo nace de una fila verificada en `user_roles`.
 * El mismo texto en perfil o membresía no crea esa fila.
 */
export type ExplicitRoleEvidence = {
  readonly userRole: LegacyRole | null;
  readonly profileRole: string | null;
  readonly tenantMemberRole: string | null;
};

export type ExplicitRoleAssignment = {
  readonly source: 'user_roles';
  readonly role: LegacyRole;
  readonly inferred: false;
};

export function assignExplicitLegacyRole(
  evidence: ExplicitRoleEvidence,
): ExplicitRoleAssignment | null {
  if (
    evidence.userRole !== null &&
    !LEGACY_ROLES.includes(evidence.userRole)
  ) {
    throw new Error('La fila user_roles contiene un rol no autorizado.');
  }

  if (evidence.userRole === null) {
    return null;
  }

  return {
    source: 'user_roles',
    role: evidence.userRole,
    inferred: false,
  };
}
