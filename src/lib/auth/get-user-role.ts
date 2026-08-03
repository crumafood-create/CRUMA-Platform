import { createClient } from '@/infrastructure/integrations/supabase/server';

export const LEGACY_ROLES = ['admin', 'customer'] as const;

export type LegacyRole = (typeof LEGACY_ROLES)[number];

export type SupabaseServerClient = Awaited<
  ReturnType<typeof createClient>
>;

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

export async function getUserRoles(
  userId: string,
  supabaseClient?: SupabaseServerClient,
): Promise<LegacyRole[]> {
  const supabase = supabaseClient ?? (await createClient());

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    throw new LegacyRoleLookupError(
      'No fue posible resolver los roles legacy del actor.',
      { cause: error },
    );
  }

  const rows = (data ?? []) as Array<{ role: unknown }>;
  const roles = rows.map(({ role }) => role);

  if (!roles.every(isLegacyRole)) {
    throw new LegacyRoleLookupError(
      'Se encontró un rol legacy fuera del contrato autorizado.',
    );
  }

  return [...new Set(roles)];
}
