'use server';

import { requireRows } from '@/infrastructure/database/query-result';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export type ProductionOrderSummary = {
  id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  status: 'draft' | 'released' | 'in_progress' | 'completed' | 'cancelled' | string;
  created_at?: string;
};

/**
 * Obtiene las órdenes de producción activas (liberadas o en progreso)
 */
export async function getProductionOrders(): Promise<ProductionOrderSummary[]> {
  const supabase = await createTypedClient();

  // Casteo a tipo seguro usando unknown
  const result = await (supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        in: (col: string, values: string[]) => {
          order: (col: string, opts: { ascending: boolean }) => Promise<unknown>;
        };
      };
    };
  })
    .from('production_orders')
    .select('id, order_number, product_name, quantity, status, created_at')
    .in('status', ['released', 'in_progress'])
    .order('created_at', { ascending: false });

  const rows = requireRows(result as Parameters<typeof requireRows>[0], 'órdenes de producción');

  return rows as unknown as ProductionOrderSummary[];
}