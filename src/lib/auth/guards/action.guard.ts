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
