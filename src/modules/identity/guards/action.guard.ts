import type { SupabaseServerClient } from '@/modules/identity/get-user-roles'; // o get-user-roles, según confirmes
import type { Permission } from '@/modules/identity/permissions/permissions.constants';

import { requireAuthenticatedUser } from './auth.guard';
import { requirePermission } from './permission.guard';
import type { AuthorizationContext } from './types';

export async function requireAuthorizedAction(
  permission: Permission,
  supabaseClient?: SupabaseServerClient,
): Promise<AuthorizationContext> {
  const context = await requireAuthenticatedUser(supabaseClient);

  requirePermission(context.actor, permission);

  return context;
}

export type TypedAuthorizationContext = Omit<
  AuthorizationContext,
  'supabase'
> & { supabase: SupabaseServerClient };

export async function requireTypedAuthorizedAction(
  permission: Permission,
  supabaseClient?: SupabaseServerClient,
): Promise<TypedAuthorizationContext> {
  const context = await requireAuthorizedAction(permission, supabaseClient);

  return {
    ...context,
    supabase: context.supabase as unknown as SupabaseServerClient,
  };
}
