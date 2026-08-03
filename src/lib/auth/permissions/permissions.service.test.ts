import { expect, test } from 'vitest';

import type { AuthorizationActor } from '@/lib/auth/guards/auth.guard';
import {
  AuthorizationError,
  requirePermission,
} from '@/lib/auth/guards/permission.guard';

import { PERMISSIONS } from './permissions.constants';
import {
  getPermissionsForRoles,
  hasPermission,
} from './permissions.service';

function actor(
  roles: AuthorizationActor['roles'],
): AuthorizationActor {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles,
    authorizationSource: 'legacy_user_roles',
  };
}

test('admin recibe la unión de permisos legacy', () => {
  const permissions = getPermissionsForRoles(['admin']);

  expect(permissions).toEqual(
    new Set(Object.values(PERMISSIONS)),
  );
});

test('customer se deniega por defecto en permisos administrativos', () => {
  expect(
    hasPermission(
      actor(['customer']),
      PERMISSIONS.CATALOG_PRODUCT_MANAGE,
    ),
  ).toBe(false);
});

test('varios roles producen una unión determinista de permisos', () => {
  expect(
    hasPermission(
      actor(['customer', 'admin']),
      PERMISSIONS.IDENTITY_USER_MANAGE,
    ),
  ).toBe(true);
});

test('requirePermission expone un reason code estable', () => {
  expect(() =>
    requirePermission(
      actor(['customer']),
      PERMISSIONS.SALES_ORDER_DELIVER,
    ),
  ).toThrowError(
    expect.objectContaining<Partial<AuthorizationError>>({
      reason: 'permission_missing',
    }),
  );
});
