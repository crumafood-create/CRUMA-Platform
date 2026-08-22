import type { SupabaseClient } from '@supabase/supabase-js';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import {
  getUserRoles,
  LegacyRoleLookupError,
  type LegacyRole,
  type SupabaseServerClient,
} from '@/lib/auth/get-user-role';

import { AuthorizationError } from './permission.guard';

export type AuthorizationActor = {
  userId: string;
  roles: readonly LegacyRole[];
  authorizationSource: 'legacy_user_roles';
};

export type AuthorizationContext = {
  actor: AuthorizationActor;
  supabase: SupabaseClient;
};

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
      supabase: supabase as unknown as SupabaseClient,
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
