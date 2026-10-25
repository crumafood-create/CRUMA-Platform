import type { AuthorizationActor } from '@/modules/identity/guards/types';

import { evaluateDualAuthorizationShadow } from './dual-authorization-shadow';
import {
  PERMISSIONS,
  type Permission,
} from './permissions.constants';

/**
 * Evidencia de denegación por scope.
 *
 * La pertenencia a organización, planta o almacén no autoriza.
 * La decisión continúa saliendo exclusivamente de `user_roles`.
 */
export type OperationalScopeClaim = {
  readonly scope: 'organization' | 'plant' | 'warehouse';
  readonly scopeId: string;
  readonly permission: Permission;
};

export type ScopeDenial = {
  readonly scope: OperationalScopeClaim['scope'];
  readonly scopeId: string;
  readonly permission: Permission;
  readonly decision: false;
  readonly reason: 'scope_does_not_authorize';
};

const DENIAL_CASES = [
  {
    scope: 'organization',
    scopeId: '30000000-0000-0000-0000-000000000001',
    permission: PERMISSIONS.IDENTITY_USER_MANAGE,
  },
  {
    scope: 'plant',
    scopeId: '40000000-0000-0000-0000-000000000001',
    permission: PERMISSIONS.PRODUCTION_ORDER_RELEASE,
  },
  {
    scope: 'warehouse',
    scopeId: '50000000-0000-0000-0000-000000000001',
    permission: PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE,
  },
] as const satisfies readonly OperationalScopeClaim[];

export function denyOperationalScopeClaims(
  actor: AuthorizationActor,
  claims: readonly OperationalScopeClaim[] = DENIAL_CASES,
): readonly ScopeDenial[] {
  return claims.map((claim) => {
    const evaluation = evaluateDualAuthorizationShadow(
      actor,
      claim.permission,
    );

    if (evaluation.decision) {
      throw new Error(
        'La denegación de scope no puede anular un permiso legacy.',
      );
    }

    return {
      scope: claim.scope,
      scopeId: claim.scopeId,
      permission: claim.permission,
      decision: false,
      reason: 'scope_does_not_authorize',
    };
  });
}
