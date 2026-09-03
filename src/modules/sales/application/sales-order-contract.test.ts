import { describe, expect, it } from 'vitest';

import {
  assertSalesOrderTransition,
  buildSalesOrderInsert,
  buildSalesOrderItemInsert,
  type SalesOrderStatus,
} from './sales-order-contract';

function orderForm(values: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.set('customer_id', values.customer_id ?? 'customer-1');
  if (values.delivery_date !== undefined) form.set('delivery_date', values.delivery_date);
  if (values.notes !== undefined) form.set('notes', values.notes);
  return form;
}

function itemForm(values: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.set('sales_order_id', values.sales_order_id ?? 'order-1');
  form.set('product_id', values.product_id ?? 'product-1');
  form.set('quantity', values.quantity ?? '2.5');
  form.set('unit_price', values.unit_price ?? '12.25');
  return form;
}

describe('contrato de órdenes de venta', () => {
  it('construye un borrador normalizado', () => {
    expect(buildSalesOrderInsert(orderForm({
      delivery_date: '2026-09-30', notes: '  Entregar temprano  ',
    }), 'SO-1')).toEqual({
      order_number: 'SO-1', customer_id: 'customer-1', status: 'draft',
      delivery_date: '2026-09-30', notes: 'Entregar temprano',
      subtotal: 0, discount: 0, tax: 0, total: 0,
    });
  });

  it.each(['09/30/2026', '2026-02-30'])(
    'rechaza fecha de entrega inválida: %j',
    (delivery_date) => expect(() => buildSalesOrderInsert(
      orderForm({ delivery_date }), 'SO-1',
    )).toThrow('Fecha de entrega inválida.'),
  );

  it('construye un renglón y calcula el total monetario', () => {
    expect(buildSalesOrderItemInsert(itemForm())).toEqual({
      sales_order_id: 'order-1', product_id: 'product-1', quantity: 2.5,
      unit_price: 12.25, discount: 0, total: 30.63, delivered_quantity: 0,
    });
  });

  it.each([
    ['quantity', '0'], ['quantity', '-1'], ['quantity', 'Infinity'],
    ['unit_price', '-1'], ['unit_price', 'NaN'],
  ])('rechaza valor numérico inválido en %s', (field, value) => {
    expect(() => buildSalesOrderItemInsert(itemForm({ [field]: value }))).toThrow();
  });

  it.each<[SalesOrderStatus, SalesOrderStatus]>([
    ['draft', 'confirmed'], ['draft', 'cancelled'],
    ['confirmed', 'preparing'], ['confirmed', 'cancelled'],
    ['preparing', 'ready'], ['ready', 'delivered'],
  ])('permite la transición %s → %s', (from, to) => {
    expect(assertSalesOrderTransition(from, to)).toBe(to);
  });

  it.each<[SalesOrderStatus, SalesOrderStatus]>([
    ['draft', 'delivered'], ['confirmed', 'delivered'],
    ['preparing', 'delivered'], ['ready', 'draft'],
    ['delivered', 'cancelled'], ['cancelled', 'confirmed'],
  ])('rechaza la transición %s → %s', (from, to) => {
    expect(() => assertSalesOrderTransition(from, to)).toThrow(
      'Transición de orden de venta inválida.',
    );
  });
});
