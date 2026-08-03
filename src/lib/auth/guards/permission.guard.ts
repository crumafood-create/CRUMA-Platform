import type { Permission } from '@/lib/auth/permissions/permissions.constants';
import { hasPermission } from '@/lib/auth/permissions/permissions.service';

import type { AuthorizationActor } from './auth.guard';

export type AuthorizationReason =
  | 'unauthenticated'
  | 'authorization_context_unavailable'
  | 'permission_missing';

export class AuthorizationError extends Error {
  constructor(
    public readonly reason: AuthorizationReason,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AuthorizationError';
  }
}

export function isAuthorizationError(
  error: unknown,
): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

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
