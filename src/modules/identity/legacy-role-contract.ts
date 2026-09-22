import type { PublicTableRow } from '@/infrastructure/integrations/supabase/database.types';

export const LEGACY_ROLES = ['admin', 'customer'] as const;

export type LegacyRole = (typeof LEGACY_ROLES)[number];

type UserRoleSelection = Pick<PublicTableRow<'user_roles'>, 'role'>;
type AuthorizedUserRoleSelection = UserRoleSelection & { role: LegacyRole };

export class LegacyRoleLookupError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LegacyRoleLookupError';
  }
}

function isLegacyRole(value: unknown): value is LegacyRole {
  return (
    typeof value === 'string' &&
    LEGACY_ROLES.some((role) => role === value)
  );
}

function isUserRoleSelection(
  value: unknown,
): value is AuthorizedUserRoleSelection {
  return (
    typeof value === 'object' &&
    value !== null &&
    'role' in value &&
    isLegacyRole(value.role)
  );
}

export function normalizeLegacyRoles(rows: readonly unknown[]): LegacyRole[] {
  if (!rows.every(isUserRoleSelection)) {
    throw new LegacyRoleLookupError(
      'Se encontró un rol legacy fuera del contrato autorizado.',
    );
  }

  return [...new Set(rows.map(({ role }) => role))];
}
