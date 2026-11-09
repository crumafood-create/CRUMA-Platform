'use server';

import { DatabaseQueryError, requireRows } from '@/infrastructure/database/query-result';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export type ReceivingOrder = {
  id: string;
  order_number: string;
  supplier_name: string;
  status: 'released' | 'partially_received' | string;
  created_at: string;
};

export type ReceivingItem = {
  id: string;
  purchase_order_id: string;
  raw_material_id: string;
  raw_material_name: string;
  expected_quantity: number;
  received_quantity: number;
  unit: string;
};

/**
 * Interface auxiliar tipada para consultas con esquemas extendidos
 */
type DynamicSupabaseClient = {
  from: (table: string) => {
    select: (cols: string) => {
      in: (col: string, values: string[]) => {
        order: (col: string, opts: { ascending: boolean }) => Promise<unknown>;
      };
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
        then: (onfulfilled?: (value: unknown) => unknown) => Promise<unknown>;
      } & Promise<unknown>;
    };
  };
};

/**
 * Obtiene todas las órdenes de compra/recepción pendientes o parciales
 */
export async function getReceivingOrders(): Promise<ReceivingOrder[]> {
  const supabase = await createTypedClient();

  const result = await supabase
    .from('purchase_orders')
    .select('id, order_number, status, created_at, supplier:suppliers!purchase_orders_supplier_id_fkey(name)')
    .is('deleted_at', null)
    .in('status', ['released', 'partially_received'])
    .order('created_at', { ascending: false });

  const rows = requireRows(result, 'órdenes de recepción');

  return rows.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    supplier_name: order.supplier?.name ?? 'Proveedor no disponible',
    status: order.status,
    created_at: order.created_at,
  }));
}

/**
 * Obtiene el detalle de una orden de recepción específica por su ID
 */
export async function getReceivingOrderById(id: string): Promise<ReceivingOrder | null> {
  const supabase = await createTypedClient();

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('id, order_number, status, created_at, supplier:suppliers!purchase_orders_supplier_id_fkey(name)')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new DatabaseQueryError('orden de recepción', error);
  if (!data) return null;

  return {
    id: data.id,
    order_number: data.order_number,
    supplier_name: data.supplier?.name ?? 'Proveedor no disponible',
    status: data.status,
    created_at: data.created_at,
  };
}

/**
 * Obtiene las partidas/ítems de una orden de recepción
 */
export async function getReceivingItems(orderId: string): Promise<ReceivingItem[]> {
  const supabase = await createTypedClient();

  const result = await (supabase as unknown as DynamicSupabaseClient)
    .from('purchase_order_items')
    .select('id, purchase_order_id, raw_material_id, raw_material_name, quantity_ordered, quantity_received, status')
    .eq('purchase_order_id', orderId);

  const rows = requireRows(result as Parameters<typeof requireRows>[0], 'partidas de recepción');

  return rows as unknown as ReceivingItem[];
}
