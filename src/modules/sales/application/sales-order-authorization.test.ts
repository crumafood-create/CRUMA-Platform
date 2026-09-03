import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const ORDER_ACTIONS = '../../../app/(admin)/sales-orders/actions.ts';
const ITEM_ACTIONS = '../../../app/(admin)/sales-orders/[id]/actions.ts';
const PROFIT_ACTIONS = '../../../app/(admin)/sales-orders/[id]/profit/actions.ts';
const PICKING_ACTIONS = '../../../app/mobile/picking/[id]/actions.ts';

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

describe('autorización de órdenes de venta', () => {
  it.each([
    [ORDER_ACTIONS, 'createSalesOrder', 'SALES_ORDER_CREATE'],
    [ORDER_ACTIONS, 'confirmSalesOrder', 'SALES_ORDER_CONFIRM'],
    [ORDER_ACTIONS, 'startPreparingSalesOrder', 'SALES_ORDER_PREPARE'],
    [ORDER_ACTIONS, 'markSalesOrderReady', 'SALES_ORDER_PREPARE'],
    [ORDER_ACTIONS, 'deliverSalesOrder', 'SALES_ORDER_DELIVER'],
    [ITEM_ACTIONS, 'createSalesOrderItem', 'SALES_ORDER_CREATE'],
    [PROFIT_ACTIONS, 'calculateSalesOrderProfit', 'SALES_ORDER_PROFIT_CALCULATE'],
    [PICKING_ACTIONS, 'confirmPicking', 'SALES_ORDER_PREPARE'],
  ])('protege %s:%s con %s', (path, action, permission) => {
    const body = actionSource(path, action);
    expect(body).toContain('requireTypedAuthorizedAction(');
    expect(body).toContain(`PERMISSIONS.${permission}`);
  });

  it.each(['confirmSalesOrder', 'deliverSalesOrder'])(
    'delega la transacción %s a una RPC', (action) => {
      expect(actionSource(ORDER_ACTIONS, action)).toContain('.rpc(');
    },
  );

  it('delega el consumo de inventario de picking a una RPC', () => {
    expect(actionSource(PICKING_ACTIONS, 'confirmPicking'))
      .toContain(".rpc('confirm_picking_item'");
  });

  it.each([
    '../../../app/(admin)/sales-orders/page.tsx',
    '../../../app/(admin)/sales-orders/new/page.tsx',
    '../../../app/(admin)/sales-orders/[id]/page.tsx',
    '../../../app/(admin)/sales-orders/[id]/items/page.tsx',
  ])('usa cliente tipado y elimina any en %s', (path) => {
    expect(source(path)).toContain('createTypedClient(');
    expect(source(path)).not.toContain('createClient(');
    expect(source(path)).not.toContain(': any');
  });
});
