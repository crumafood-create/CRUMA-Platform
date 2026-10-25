import type { AuthorizationActor } from '@/modules/identity/guards/types';

import type { Permission } from './permissions.constants';
import { hasPermission } from './permissions.service';
import {
  equivalentPermissions,
  type RoleVocabulary,
} from './role-vocabulary-equivalence';

/**
 * Evaluación dual en sombra.
 *
 * Compara la autoridad efectiva con los vocabularios externos, pero
 * no cambia la decisión. Una sombra que concediera más que
 * `user_roles` es una violación del contrato, no una autorización.
 */
export type ShadowRoleClaim = {
  readonly vocabulary: Exclude<RoleVocabulary, 'user_roles'>;
  readonly value: string;
};

export type DualAuthorizationShadow = {
  readonly mode: 'shadow';
  readonly effective: boolean;
  readonly shadow: boolean;
  readonly decision: boolean;
  readonly widened: false;
};

export function evaluateDualAuthorizationShadow(
  actor: AuthorizationActor,
  permission: Permission,
  claims: readonly ShadowRoleClaim[] = [],
): DualAuthorizationShadow {
  const effective = hasPermission(actor, permission);
  const shadow = claims.some((claim) =>
    equivalentPermissions(claim.vocabulary, claim.value).includes(
      permission,
    ),
  );

  if (shadow && !effective) {
    throw new Error(
      'La evaluación sombra concedería más que user_roles.',
    );
  }

  return {
    mode: 'shadow',
    effective,
    shadow,
    decision: effective,
    widened: false,
  };
}
