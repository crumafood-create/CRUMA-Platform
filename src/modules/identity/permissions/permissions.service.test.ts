import { expect, test } from 'vitest';

import type { AuthorizationActor } from '@/modules/identity/guards/types';
import { AuthorizationError } from '@/modules/identity/guards/authorization-error';
import { requirePermission } from '@/modules/identity/guards/permission.guard';

import { LEGACY_AUTHORIZATION_BOUNDARY } from './legacy-authorization-boundary';
import { PERMISSIONS } from './permissions.constants';
import { LEGACY_PERMISSION_CONTRACT } from './permissions.matrix';
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

test('el puente legacy permanece global y sin scopes operativos', () => {
  expect(LEGACY_AUTHORIZATION_BOUNDARY).toEqual({
    source: 'legacy_user_roles',
    scope: 'global',
    supportedRoles: ['admin', 'customer'],
    missingScopes: ['organization', 'plant', 'warehouse'],
  });
  expect(LEGACY_PERMISSION_CONTRACT.boundary).toBe(
    LEGACY_AUTHORIZATION_BOUNDARY,
  );
});

test('admin recibe exactamente el catálogo publicado, sin permisos implícitos', () => {
  const permissions = getPermissionsForRoles(['admin']);
  const publishedPermissions = Object.values(PERMISSIONS);

  expect([...permissions]).toEqual(publishedPermissions);
  expect(permissions).toEqual(new Set(publishedPermissions));
  expect(LEGACY_PERMISSION_CONTRACT.grants.admin).toEqual(
    publishedPermissions,
  );
});

test('customer se deniega por defecto en todos los permisos publicados', () => {
  expect(getPermissionsForRoles(['customer'])).toEqual(new Set());
  expect(LEGACY_PERMISSION_CONTRACT.grants.customer).toEqual([]);

  for (const permission of Object.values(PERMISSIONS)) {
    expect(hasPermission(actor(['customer']), permission)).toBe(false);
  }
});

test('un actor sin roles no hereda autoridad', () => {
  expect(getPermissionsForRoles([])).toEqual(new Set());
  expect(
    hasPermission(actor([]), PERMISSIONS.ADMIN_PANEL_ACCESS),
  ).toBe(false);
});

test('el catálogo conserva los permisos confirmados de producción y ventas', () => {
  expect(PERMISSIONS).toMatchObject({
    PRODUCTION_ORDER_CREATE: 'production.order.create',
    PRODUCTION_ORDER_RELEASE: 'production.order.release',
    PRODUCTION_ORDER_START: 'production.order.start',
    PRODUCTION_ORDER_CANCEL: 'production.order.cancel',
    PRODUCTION_ORDER_COMPLETE: 'production.order.complete',
    SALES_ORDER_CREATE: 'sales.order.create',
    SALES_ORDER_CONFIRM: 'sales.order.confirm',
    SALES_ORDER_PREPARE: 'sales.order.prepare',
    SALES_ORDER_DELIVER: 'sales.order.deliver',
  });
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
