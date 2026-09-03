import { describe, expect, it } from 'vitest';

import {
  assertPurchaseOrderTransition,
  buildPurchaseOrderInsert,
  buildPurchaseOrderItemInsert,
  calculatePendingReceipt,
  calculateWeightedAverageCost,
  type PurchaseOrderStatus,
} from './purchase-order-contract';

function orderForm(values: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.set('supplier_id', values.supplier_id ?? 'supplier-1');
  if (values.expected_date !== undefined) form.set('expected_date', values.expected_date);
  if (values.notes !== undefined) form.set('notes', values.notes);
  return form;
}

function itemForm(values: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.set('purchase_order_id', values.purchase_order_id ?? 'order-1');
  form.set('raw_material_id', values.raw_material_id ?? 'material-1');
  form.set('quantity', values.quantity ?? '2.5');
  form.set('unit_cost', values.unit_cost ?? '12.25');
  return form;
}

describe('contrato de órdenes de compra', () => {
  it('construye una orden borrador con campos normalizados', () => {
    expect(buildPurchaseOrderInsert(orderForm({
      expected_date: '2026-09-30',
      notes: '  Entregar temprano  ',
    }), 'PO-1')).toEqual({
      order_number: 'PO-1',
      supplier_id: 'supplier-1',
      status: 'draft',
      expected_date: '2026-09-30',
      notes: 'Entregar temprano',
      subtotal: 0,
      total: 0,
    });
  });

  it('normaliza una fecha esperada vacía', () => {
    expect(buildPurchaseOrderInsert(orderForm({ expected_date: '' }), 'PO-1').expected_date)
      .toBeNull();
  });

  it.each(['09/30/2026', '2026-02-30'])(
    'rechaza fecha esperada inválida: %j',
    (expected_date) => {
      expect(() => buildPurchaseOrderInsert(
        orderForm({ expected_date }),
        'PO-1',
      )).toThrow('Fecha esperada inválida.');
    },
  );

  it('construye un renglón y calcula su total', () => {
    expect(buildPurchaseOrderItemInsert(itemForm())).toEqual({
      purchase_order_id: 'order-1',
      raw_material_id: 'material-1',
      quantity: 2.5,
      unit_cost: 12.25,
      total: 30.625,
      received_quantity: 0,
    });
  });

  it.each([
    ['quantity', '0'],
    ['quantity', '-1'],
    ['quantity', 'Infinity'],
    ['unit_cost', '-1'],
    ['unit_cost', 'NaN'],
  ])('rechaza valor numérico inválido en %s', (field, value) => {
    expect(() => buildPurchaseOrderItemInsert(itemForm({ [field]: value })))
      .toThrow();
  });

  it.each<[PurchaseOrderStatus, PurchaseOrderStatus]>([
    ['draft', 'released'],
    ['draft', 'cancelled'],
    ['released', 'partially_received'],
    ['released', 'received'],
    ['released', 'cancelled'],
    ['partially_received', 'received'],
  ])('permite la transición %s → %s', (from, to) => {
    expect(assertPurchaseOrderTransition(from, to)).toBe(to);
  });

  it.each<[PurchaseOrderStatus, PurchaseOrderStatus]>([
    ['draft', 'received'],
    ['received', 'released'],
    ['received', 'cancelled'],
    ['cancelled', 'released'],
    ['partially_received', 'cancelled'],
  ])('rechaza la transición %s → %s', (from, to) => {
    expect(() => assertPurchaseOrderTransition(from, to)).toThrow(
      'Transición de orden de compra inválida.',
    );
  });

  it('recibe solo la cantidad pendiente', () => {
    expect(calculatePendingReceipt(10, 4)).toBe(6);
    expect(() => calculatePendingReceipt(10, 10)).toThrow(
      'El renglón ya fue recibido por completo.',
    );
  });

  it('calcula costo promedio ponderado por existencias', () => {
    expect(calculateWeightedAverageCost(8, 10, 2, 20)).toBe(12);
    expect(calculateWeightedAverageCost(0, 0, 2, 20)).toBe(20);
  });
});
