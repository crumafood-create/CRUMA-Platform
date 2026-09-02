import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertPurchaseOrderCanRelease,
  assertPurchaseOrderItemCanBeAdded,
  assertSupplierCanReceiveOrders,
} from './purchase-order-repository';

type Result = { data: unknown; error: { message: string } | null };

function client(results: Record<string, Result[]>): TypedSupabaseClient {
  const from = (table: string) => {
    const result = () => results[table]?.shift() ?? { data: null, error: null };
    const query = {
      select: () => query,
      eq: () => query,
      is: () => query,
      limit: () => query,
      maybeSingle: async () => result(),
      then: (resolve: (value: Result) => unknown) => Promise.resolve(result()).then(resolve),
    };
    return query;
  };

  return { from } as unknown as TypedSupabaseClient;
}

describe('repositorio de órdenes de compra', () => {
  it('acepta únicamente proveedores activos y no eliminados', async () => {
    const supabase = client({ suppliers: [{ data: { id: 'supplier-1' }, error: null }] });
    await expect(assertSupplierCanReceiveOrders(supabase, 'supplier-1')).resolves.toBeUndefined();
  });

  it('rechaza proveedores inexistentes, inactivos o eliminados', async () => {
    const supabase = client({ suppliers: [{ data: null, error: null }] });
    await expect(assertSupplierCanReceiveOrders(supabase, 'supplier-1')).rejects.toThrow(
      'El proveedor no está disponible para nuevas órdenes.',
    );
  });

  it('libera solo borradores que contienen al menos un renglón', async () => {
    const supabase = client({
      purchase_orders: [{ data: { id: 'order-1', status: 'draft' }, error: null }],
      purchase_order_items: [{ data: [{ id: 'item-1' }], error: null }],
    });
    await expect(assertPurchaseOrderCanRelease(supabase, 'order-1')).resolves.toBeUndefined();
  });

  it('rechaza liberar una orden vacía', async () => {
    const supabase = client({
      purchase_orders: [{ data: { id: 'order-1', status: 'draft' }, error: null }],
      purchase_order_items: [{ data: [], error: null }],
    });
    await expect(assertPurchaseOrderCanRelease(supabase, 'order-1')).rejects.toThrow(
      'La orden debe contener al menos un renglón.',
    );
  });

  it('rechaza materias primas duplicadas dentro de un borrador', async () => {
    const supabase = client({
      purchase_orders: [{ data: { id: 'order-1', status: 'draft' }, error: null }],
      raw_materials: [{ data: { id: 'material-1' }, error: null }],
      purchase_order_items: [{ data: { id: 'item-1' }, error: null }],
    });
    await expect(assertPurchaseOrderItemCanBeAdded(
      supabase,
      'order-1',
      'material-1',
    )).rejects.toThrow('La materia prima ya está incluida en la orden.');
  });
});
