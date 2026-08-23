import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { fetchInventoryAlerts } from './inventory-alert-repository';

type TableName = 'inventory_stock_by_item' | 'products' | 'raw_materials';
type Result = { data: unknown; error: { message: string } | null };
type QueryBuilder = Promise<Result> & {
  select: () => QueryBuilder;
  in: () => QueryBuilder;
};

function clientWith(fixtures: Partial<Record<TableName, Result>>) {
  const calls: TableName[] = [];

  const client = {
    from(table: TableName) {
      calls.push(table);

      const result = fixtures[table] ?? { data: [], error: null };
      let query: QueryBuilder;

      query = Object.assign(Promise.resolve(result), {
        select() { return query; },
        in() { return query; },
      });

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls };
}

describe('repositorio tipado de alertas de inventario', () => {
  it('consulta exclusivamente los catálogos necesarios para las alertas', async () => {
    const { client, calls } = clientWith({
      inventory_stock_by_item: {
        data: [{ item_type: 'raw_material', item_id: 'material-1', quantity: 1 }],
        error: null,
      },
      raw_materials: {
        data: [{ id: 'material-1', name: 'Harina', internal_code: 'MP-HAR', minimum_stock: 2 }],
        error: null,
      },
    });

    const alerts = await fetchInventoryAlerts(client);

    expect(calls).toEqual(['inventory_stock_by_item', 'raw_materials']);
    expect(alerts[0]?.name).toBe('Harina');
  });

  it('omite consultas auxiliares cuando no hay stock identificable', async () => {
    const { client, calls } = clientWith({
      inventory_stock_by_item: {
        data: [{ item_type: 'product', item_id: null, quantity: 1 }],
        error: null,
      },
    });

    expect(await fetchInventoryAlerts(client)).toEqual([]);
    expect(calls).toEqual(['inventory_stock_by_item']);
  });

  it('propaga errores de la vista de stock', async () => {
    const { client } = clientWith({
      inventory_stock_by_item: { data: null, error: { message: 'Stock no disponible.' } },
    });

    await expect(fetchInventoryAlerts(client)).rejects.toThrow('Stock no disponible.');
  });

  it('propaga errores de los catálogos consultados', async () => {
    const { client } = clientWith({
      inventory_stock_by_item: {
        data: [{ item_type: 'product', item_id: 'product-1', quantity: 1 }],
        error: null,
      },
      products: { data: null, error: { message: 'Productos no disponibles.' } },
    });

    await expect(fetchInventoryAlerts(client)).rejects.toThrow('Productos no disponibles.');
  });
});
