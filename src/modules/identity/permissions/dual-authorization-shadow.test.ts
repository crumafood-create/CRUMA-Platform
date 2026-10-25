import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/modules/identity/guards/types';

import { evaluateDualAuthorizationShadow } from './dual-authorization-shadow';
import { PERMISSIONS } from './permissions.constants';

function actor(
  roles: AuthorizationActor['roles'],
): AuthorizationActor {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles,
    authorizationSource: 'legacy_user_roles',
  };
}

const permission = PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE;

describe('evaluación dual en sombra', () => {
  it('conserva la decisión efectiva aunque existan admin homónimos', () => {
    const evaluation = evaluateDualAuthorizationShadow(
      actor(['customer']),
      permission,
      [
        { vocabulary: 'profiles', value: 'admin' },
        { vocabulary: 'tenant_members', value: 'admin' },
        { vocabulary: 'admin_permissions', value: 'permission_id' },
      ],
    );

    expect(evaluation).toEqual({
      mode: 'shadow',
      effective: false,
      shadow: false,
      decision: false,
      widened: false,
    });
  });

  it('no usa la sombra para negar un permiso ya concedido', () => {
    const evaluation = evaluateDualAuthorizationShadow(
      actor(['admin']),
      permission,
      [{ vocabulary: 'tenant_members', value: 'viewer' }],
    );

    expect(evaluation.effective).toBe(true);
    expect(evaluation.shadow).toBe(false);
    expect(evaluation.decision).toBe(true);
  });

  it('rechaza una sombra que ampliaría privilegios', () => {
    expect(() =>
      evaluateDualAuthorizationShadow(
        actor([]),
        permission,
        [{ vocabulary: 'user_roles', value: 'admin' } as never],
      ),
    ).toThrow(/concedería más que user_roles/);
  });

  it('rechaza un valor externo sin equivalencia verificada', () => {
    expect(() =>
      evaluateDualAuthorizationShadow(actor(['admin']), permission, [
        { vocabulary: 'profiles', value: 'owner' },
      ]),
    ).toThrow(/No existe equivalencia verificada/);
  });
});
