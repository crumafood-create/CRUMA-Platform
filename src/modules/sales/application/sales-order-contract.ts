import type { PublicTableInsert } from '@/infrastructure/integrations/supabase/database.types';

export type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

const TRANSITIONS: Record<SalesOrderStatus, readonly SalesOrderStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
};

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';
  if (!value) throw new Error(`El campo ${field} es obligatorio.`);
  return value;
}

function optionalDate(form: FormData, field: string): string | null {
  const value = form.get(field)?.toString().trim() ?? '';
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)
    || Number.isNaN(date.valueOf())
    || date.toISOString().slice(0, 10) !== value) {
    throw new Error('Fecha de entrega inválida.');
  }
  return value;
}

function finiteNumber(form: FormData, field: string, allowZero: boolean): number {
  const value = Number(requiredText(form, field));
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new Error(`El campo ${field} contiene un valor inválido.`);
  }
  return value;
}

export function buildSalesOrderInsert(
  form: FormData,
  orderNumber: string,
): PublicTableInsert<'sales_orders'> {
  return {
    order_number: orderNumber,
    customer_id: requiredText(form, 'customer_id'),
    status: 'draft',
    delivery_date: optionalDate(form, 'delivery_date'),
    notes: form.get('notes')?.toString().trim() || null,
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
  };
}

export function buildSalesOrderItemInsert(
  form: FormData,
): PublicTableInsert<'sales_order_items'> {
  const quantity = finiteNumber(form, 'quantity', false);
  const unitPrice = finiteNumber(form, 'unit_price', true);
  return {
    sales_order_id: requiredText(form, 'sales_order_id'),
    product_id: requiredText(form, 'product_id'),
    quantity,
    unit_price: unitPrice,
    discount: 0,
    total: Number((quantity * unitPrice).toFixed(2)),
    delivered_quantity: 0,
  };
}

export function assertSalesOrderStatus(value: unknown): SalesOrderStatus {
  if (typeof value !== 'string' || !(value in TRANSITIONS)) {
    throw new Error('Estado de orden de venta fuera del contrato.');
  }
  return value as SalesOrderStatus;
}

export function assertSalesOrderTransition(
  from: SalesOrderStatus,
  to: SalesOrderStatus,
): SalesOrderStatus {
  if (!TRANSITIONS[from].includes(to)) {
    throw new Error('Transición de orden de venta inválida.');
  }
  return to;
}
