import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import {
  LegacyRoleLookupError,
  normalizeLegacyRoles,
  type LegacyRole,
} from './legacy-role-contract';

export { LEGACY_ROLES, LegacyRoleLookupError } from './legacy-role-contract';
export type { LegacyRole } from './legacy-role-contract';

export type SupabaseServerClient = Awaited<
  ReturnType<typeof createTypedClient>
>;

export async function getUserRoles(
  userId: string,
  supabaseClient?: SupabaseServerClient,
): Promise<LegacyRole[]> {
  const supabase = supabaseClient ?? (await createTypedClient());

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

  return normalizeLegacyRoles(data ?? []);
}
