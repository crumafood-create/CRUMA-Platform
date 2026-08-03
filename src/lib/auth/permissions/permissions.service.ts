import type { AuthorizationActor } from '@/lib/auth/guards/auth.guard';

import type { Permission } from './permissions.constants';
import { LEGACY_ROLE_PERMISSIONS } from './permissions.matrix';

export function getPermissionsForRoles(
  roles: AuthorizationActor['roles'],
): ReadonlySet<Permission> {
  return new Set(
    roles.flatMap((role) => LEGACY_ROLE_PERMISSIONS[role]),
  );
}

export function hasPermission(
  actor: AuthorizationActor,
  permission: Permission,
): boolean {
  return getPermissionsForRoles(actor.roles).has(permission);
}
