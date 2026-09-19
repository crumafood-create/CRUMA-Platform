import { describe, expect, it, vi } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { loadInventoryStockView } from './inventory-stock-repository';

function clientWithStock() {
  const fixtures: Record<string, unknown[]> = {
    inventory_stock_by_item: [
      { item_type: 'product', item_id: 'product-1', quantity: 2 },
      { item_type: 'raw_material', item_id: 'material-1', quantity: 0 },
    ],
    products: [{ id: 'product-1', name: 'Tequeños', internal_code: 'PT-1', min_stock: 5 }],
    raw_materials: [{ id: 'material-1', name: 'Harina', internal_code: 'MP-1', minimum_stock: 10 }],
  };
  const from = vi.fn((table: string) => {
    const query: Record<string, unknown> = {};
    query.select = () => query;
    query.in = () => query;
    query.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: fixtures[table] ?? [], error: null }).then(resolve);
    return query;
  });
  return { client: { from } as unknown as TypedSupabaseClient, from };
}

describe('vista optimizada de existencias', () => {
  it('consulta stock y catálogos una sola vez, priorizando agotados', async () => {
    const { client, from } = clientWithStock();
    const view = await loadInventoryStockView(client);

    expect(from.mock.calls.map(([table]) => table)).toEqual([
      'inventory_stock_by_item', 'products', 'raw_materials',
    ]);
    expect(view.items.map((item) => item.itemId)).toEqual(['material-1', 'product-1']);
    expect(view.items[0]).toMatchObject({ severity: 'out', shortage: 10 });
    expect(view.summary).toEqual({ references: 2, critical: 2, outOfStock: 1 });
  });

  it('normaliza errores de Supabase sin exponer el detalle del proveedor', async () => {
    const query: Record<string, unknown> = {};
    query.select = () => query;
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({
      data: null,
      error: { code: 'PGRST500', message: 'provider detail' },
    }).then(resolve);
    const client = {
      from: vi.fn(() => query),
    } as unknown as TypedSupabaseClient;

    await expect(loadInventoryStockView(client)).rejects.toThrow(
      'No fue posible cargar existencias.',
    );
  });
});
