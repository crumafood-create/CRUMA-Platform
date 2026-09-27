'use server';

import { requireRows } from '@/infrastructure/database/query-result';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export type ReceivingOrder = {
  id: string;
  order_number: string;
  supplier_name: string;
  status: 'draft' | 'pending' | 'partial' | 'received' | 'cancelled' | string;
  total_items: number;
  received_items: number;
  created_at?: string;
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

  const result = await (supabase as unknown as DynamicSupabaseClient)
    .from('purchase_orders')
    .select('id, order_number, supplier_name, status, total_items, received_items, created_at')
    .in('status', ['pending', 'partial'])
    .order('created_at', { ascending: false });

  const rows = requireRows(result as Parameters<typeof requireRows>[0], 'órdenes de recepción');

  return rows as unknown as ReceivingOrder[];
}

/**
 * Obtiene el detalle de una orden de recepción específica por su ID
 */
export async function getReceivingOrderById(id: string): Promise<ReceivingOrder | null> {
  const supabase = await createTypedClient();

  const { data, error } = await (supabase as unknown as DynamicSupabaseClient)
    .from('purchase_orders')
    .select('id, order_number, supplier_name, status, total_items, received_items, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  return data as unknown as ReceivingOrder;
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