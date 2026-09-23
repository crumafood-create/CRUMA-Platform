import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import {
  getUserRoles,
  LegacyRoleLookupError,
} from '@/modules/identity/get-user-roles';
import type { SupabaseServerClient } from '@/modules/identity/get-user-roles';

import { AuthorizationError } from './authorization-error';
import type { AuthorizationContext } from './types';

export async function requireAuthenticatedUser(
  supabaseClient?: SupabaseServerClient,
): Promise<AuthorizationContext> {
  const supabase = supabaseClient ?? (await createTypedClient());
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthorizationError(
      'unauthenticated',
      'Se requiere una sesión autenticada.',
      error ? { cause: error } : undefined,
    );
  }

  try {
    const roles = await getUserRoles(user.id, supabase);

    return {
      actor: {
        userId: user.id,
        roles,
        authorizationSource: 'legacy_user_roles',
      },
      supabase,
    };
  } catch (roleError) {
    if (roleError instanceof LegacyRoleLookupError) {
      throw new AuthorizationError(
        'authorization_context_unavailable',
        'No fue posible construir el contexto de autorización.',
        { cause: roleError },
      );
    }

    throw roleError;
  }
}