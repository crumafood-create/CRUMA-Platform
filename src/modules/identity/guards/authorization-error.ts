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