import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertCustomerCanOrder,
  assertSalesOrderItemCanBeAdded,
} from './sales-order-repository';

type Result = { data: unknown; error: { message: string } | null };

function client(results: Record<string, Result[]>): TypedSupabaseClient {
  const from = (table: string) => {
    const result = () => results[table]?.shift() ?? { data: null, error: null };
    const query = {
      select: () => query, eq: () => query, is: () => query,
      maybeSingle: async () => result(),
    };
    return query;
  };
  return { from } as unknown as TypedSupabaseClient;
}

describe('repositorio de órdenes de venta', () => {
  it('acepta únicamente clientes activos y no eliminados', async () => {
    const supabase = client({ customers: [{ data: { id: 'customer-1' }, error: null }] });
    await expect(assertCustomerCanOrder(supabase, 'customer-1')).resolves.toBeUndefined();
  });

  it('rechaza clientes no disponibles', async () => {
    const supabase = client({ customers: [{ data: null, error: null }] });
    await expect(assertCustomerCanOrder(supabase, 'customer-1')).rejects.toThrow(
      'El cliente no está disponible para nuevas órdenes.',
    );
  });

  it('rechaza productos duplicados dentro de un borrador', async () => {
    const supabase = client({
      sales_orders: [{ data: { id: 'order-1', status: 'draft' }, error: null }],
      products: [{ data: { id: 'product-1' }, error: null }],
      sales_order_items: [{ data: { id: 'item-1' }, error: null }],
    });
    await expect(assertSalesOrderItemCanBeAdded(
      supabase, 'order-1', 'product-1',
    )).rejects.toThrow('El producto ya está incluido en la orden.');
  });
});
