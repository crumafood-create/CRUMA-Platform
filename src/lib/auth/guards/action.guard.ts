import type { SupabaseServerClient } from '@/lib/auth/get-user-role';
import type { Permission } from '@/lib/auth/permissions/permissions.constants';

import {
  requireAuthenticatedUser,
  type AuthorizationContext,
} from './auth.guard';
import { requirePermission } from './permission.guard';

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
