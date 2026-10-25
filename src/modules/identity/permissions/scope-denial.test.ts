import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/modules/identity/guards/types';

import { PERMISSIONS } from './permissions.constants';
import { denyOperationalScopeClaims } from './scope-denial';

function actor(
  roles: AuthorizationActor['roles'],
): AuthorizationActor {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles,
    authorizationSource: 'legacy_user_roles',
  };
}

describe('denegación de scopes operativos', () => {
  it('niega organización, planta y almacén sin autoridad legacy', () => {
    expect(denyOperationalScopeClaims(actor([]))).toEqual([
      {
        scope: 'organization',
        scopeId: '30000000-0000-0000-0000-000000000001',
        permission: PERMISSIONS.IDENTITY_USER_MANAGE,
        decision: false,
        reason: 'scope_does_not_authorize',
      },
      {
        scope: 'plant',
        scopeId: '40000000-0000-0000-0000-000000000001',
        permission: PERMISSIONS.PRODUCTION_ORDER_RELEASE,
        decision: false,
        reason: 'scope_does_not_authorize',
      },
      {
        scope: 'warehouse',
        scopeId: '50000000-0000-0000-0000-000000000001',
        permission: PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE,
        decision: false,
        reason: 'scope_does_not_authorize',
      },
    ]);
  });

  it('no convierte la denegación de scope en una denegación legacy', () => {
    expect(() =>
      denyOperationalScopeClaims(actor(['admin'])),
    ).toThrow(/no puede anular un permiso legacy/);
  });
});
