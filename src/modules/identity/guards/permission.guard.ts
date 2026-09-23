import type { Permission } from '@/modules/identity/permissions/permissions.constants';
import { hasPermission } from '@/modules/identity/permissions/permissions.service';

import { AuthorizationError } from './authorization-error';

import type { AuthorizationActor } from './types';

export function requirePermission(
  actor: AuthorizationActor,
  permission: Permission,
): void {
  if (!hasPermission(actor, permission)) {
    throw new AuthorizationError(
      'permission_missing',
      `El actor no posee el permiso requerido: ${permission}`,
    );
  }
}