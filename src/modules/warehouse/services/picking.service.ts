import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { requireRows } from '@/infrastructure/database/query-result';

export type PickingOrder = {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | string;
  sales_order_id: string;
  created_at: string;
};

export async function getActivePickingOrders(): Promise<PickingOrder[]> {
  const supabase = await createTypedClient();
  const result = await supabase
    .from('picking_orders')
    .select('id, status, sales_order_id, created_at')
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false });

  return requireRows(result, 'órdenes de picking') as PickingOrder[];
}