import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/modules/identity/guards/types';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { hasPermission } from '@/modules/identity/permissions/permissions.service';

const ORDER_ACTIONS = '../../../app/(admin)/purchase-orders/actions.ts';
const ITEM_ACTIONS = '../../../app/(admin)/purchase-orders/[id]/items/actions.ts';
const MOBILE_RECEIVING = '../../../app/mobile/receiving/[id]/actions.ts';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

function actionSource(path: string, action: string): string {
  const file = source(path);
  const start = file.indexOf(`export async function ${action}`);
  const next = file.indexOf('export async function ', start + 1);
  if (start < 0) throw new Error(`Acción no encontrada: ${action}`);
  return file.slice(start, next < 0 ? undefined : next);
}

function actor(role: 'admin' | 'customer'): AuthorizationActor {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles: [role],
    authorizationSource: 'legacy_user_roles',
  };
}

describe('autorización de órdenes de compra', () => {
  it('define permisos separados para gestión y recepción', () => {
    expect(PERMISSIONS.PROCUREMENT_ORDER_MANAGE).toBe('procurement.order.manage');
    expect(PERMISSIONS.PROCUREMENT_ORDER_RECEIVE).toBe('procurement.order.receive');
  });

  it.each(['PROCUREMENT_ORDER_MANAGE', 'PROCUREMENT_ORDER_RECEIVE'] as const)(
    'autoriza administradores y bloquea clientes para %s',
    (permission) => {
      expect(hasPermission(actor('admin'), PERMISSIONS[permission])).toBe(true);
      expect(hasPermission(actor('customer'), PERMISSIONS[permission])).toBe(false);
    },
  );

  it.each([
    [ORDER_ACTIONS, 'createPurchaseOrder'],
    [ORDER_ACTIONS, 'releasePurchaseOrder'],
    [ORDER_ACTIONS, 'cancelPurchaseOrder'],
    [ITEM_ACTIONS, 'createPurchaseOrderItem'],
  ])('protege %s antes de escribir en %s', (path, action) => {
    const body = actionSource(path, action);
    expect(body).toContain('requireTypedAuthorizedAction(');
    expect(body).toContain('PERMISSIONS.PROCUREMENT_ORDER_MANAGE');
    const write = Math.max(body.indexOf('.from('), body.indexOf('.rpc('));
    expect(write).toBeGreaterThan(body.indexOf('requireTypedAuthorizedAction('));
  });

  it('protege la recepción móvil y delega la transacción a la base de datos', () => {
  const body = actionSource(
    MOBILE_RECEIVING,
    'confirmReceiving',
  );

  const authorization =
    body.indexOf(
      'requireTypedAuthorizedAction(',
    );

  const transaction =
    body.indexOf(
      "'receive_purchase_order_lot'",
    );

  expect(body).toContain(
    'parsePurchaseReceivingInput(',
  );

  expect(body).toContain(
    'PERMISSIONS.PROCUREMENT_ORDER_RECEIVE',
  );

  expect(authorization).toBeGreaterThan(-1);

  expect(transaction).toBeGreaterThan(
    authorization,
  );

  expect(body).not.toContain(
    ".from('raw_material_lots')",
  );
})
})