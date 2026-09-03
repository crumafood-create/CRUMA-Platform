import type {
  PublicTableInsert,
} from '@/infrastructure/integrations/supabase/database.types';

export type PurchaseOrderStatus =
  | 'draft'
  | 'released'
  | 'partially_received'
  | 'received'
  | 'cancelled';

const TRANSITIONS: Record<PurchaseOrderStatus, readonly PurchaseOrderStatus[]> = {
  draft: ['released', 'cancelled'],
  released: ['partially_received', 'received', 'cancelled'],
  partially_received: ['received'],
  received: [],
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
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = new Date(`${value}T00:00:00Z`);
  if (!match || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error('Fecha esperada inválida.');
  }
  return value;
}

function finiteNumber(form: FormData, field: string, allowZero: boolean): number {
  const raw = requiredText(form, field);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new Error(`El campo ${field} contiene un valor inválido.`);
  }
  return value;
}

export function buildPurchaseOrderInsert(
  form: FormData,
  orderNumber: string,
): PublicTableInsert<'purchase_orders'> {
  return {
    order_number: orderNumber,
    supplier_id: requiredText(form, 'supplier_id'),
    status: 'draft',
    expected_date: optionalDate(form, 'expected_date'),
    notes: form.get('notes')?.toString().trim() || null,
    subtotal: 0,
    total: 0,
  };
}

export function buildPurchaseOrderItemInsert(
  form: FormData,
): PublicTableInsert<'purchase_order_items'> {
  const quantity = finiteNumber(form, 'quantity', false);
  const unitCost = finiteNumber(form, 'unit_cost', true);
  return {
    purchase_order_id: requiredText(form, 'purchase_order_id'),
    raw_material_id: requiredText(form, 'raw_material_id'),
    quantity,
    unit_cost: unitCost,
    total: Number((quantity * unitCost).toFixed(4)),
    received_quantity: 0,
  };
}

export function assertPurchaseOrderStatus(value: unknown): PurchaseOrderStatus {
  if (typeof value !== 'string' || !(value in TRANSITIONS)) {
    throw new Error('Estado de orden de compra fuera del contrato.');
  }
  return value as PurchaseOrderStatus;
}

export function assertPurchaseOrderTransition(
  from: PurchaseOrderStatus,
  to: PurchaseOrderStatus,
): PurchaseOrderStatus {
  if (!TRANSITIONS[from].includes(to)) {
    throw new Error('Transición de orden de compra inválida.');
  }
  return to;
}

export function calculatePendingReceipt(quantity: number, received: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(received) || quantity <= 0 || received < 0) {
    throw new Error('Cantidades de recepción inválidas.');
  }
  const pending = Number((quantity - received).toFixed(4));
  if (pending <= 0) throw new Error('El renglón ya fue recibido por completo.');
  return pending;
}

export function calculateWeightedAverageCost(
  currentStock: number,
  currentCost: number,
  received: number,
  purchaseCost: number,
): number {
  const totalStock = currentStock + received;
  if (totalStock <= 0) return purchaseCost;
  return Number(((currentStock * currentCost + received * purchaseCost) / totalStock).toFixed(4));
}
