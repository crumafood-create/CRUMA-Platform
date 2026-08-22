import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  fetchMobileProductionDetail,
  fetchMobileProductionOrders,
} from './mobile-production-repository';

type TableName =
  | 'production_orders'
  | 'production_order_items'
  | 'recipes'
  | 'raw_materials';

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

type QueryCall = {
  table: TableName;
  columns: string;
};

type QueryBuilder = Promise<QueryResult> & {
  select: (columns: string) => QueryBuilder;
  in: (column: string, values: readonly string[]) => QueryBuilder;
  eq: (column: string, value: string) => QueryBuilder;
  order: (column: string, options: unknown) => QueryBuilder;
  single: () => Promise<QueryResult>;
};

const canonicalOrder = {
  id: 'order-1',
  production_number: 'OP-20260822-000001',
  recipe_id: 'recipe-1',
  planned_quantity: 12,
  produced_quantity: null,
  production_status: 'released',
  created_at: '2026-08-22T12:00:00.000Z',
};

function clientWith(fixtures: Partial<Record<TableName, QueryResult>>) {
  const calls: QueryCall[] = [];

  const client = {
    from(table: TableName) {
      const result = fixtures[table] ?? { data: [], error: null };
      const call = { table, columns: '' };

      calls.push(call);

      let query: QueryBuilder;

      query = Object.assign(Promise.resolve(result), {
        select(columns: string) {
          call.columns = columns;
          return query;
        },
        in() {
          return query;
        },
        eq() {
          return query;
        },
        order() {
          return query;
        },
        single() {
          return Promise.resolve(result);
        },
      });

      return query;
    },
  } as unknown as TypedSupabaseClient;

  return { client, calls };
}

describe('repositorio tipado de producción móvil', () => {
  it('consulta órdenes, recetas e items sin joins implícitos', async () => {
    const { client, calls } = clientWith({
      production_orders: { data: [canonicalOrder], error: null },
      recipes: { data: [{ id: 'recipe-1', name: 'Masa clásica' }], error: null },
      production_order_items: {
        data: [
          { production_order_id: 'order-1', status: 'completed' },
          { production_order_id: 'order-1', status: 'pending' },
        ],
        error: null,
      },
    });

    const orders = await fetchMobileProductionOrders(client);

    expect(orders[0]?.production_number).toBe('OP-20260822-000001');
    expect(orders[0]?.production_status).toBe('released');
    expect(orders[0]?.recipe_name).toBe('Masa clásica');
    expect(orders[0]?.completed_items).toBe(1);
    expect(calls.map((call) => call.table)).toEqual([
      'production_orders',
      'recipes',
      'production_order_items',
    ]);
  });

  it('omite consultas auxiliares cuando no existen órdenes', async () => {
    const { client, calls } = clientWith({
      production_orders: { data: [], error: null },
    });

    expect(await fetchMobileProductionOrders(client)).toEqual([]);
    expect(calls.map((call) => call.table)).toEqual(['production_orders']);
  });

  it('compone el detalle usando materias primas consultadas por separado', async () => {
    const { client, calls } = clientWith({
      production_orders: { data: canonicalOrder, error: null },
      recipes: { data: [{ id: 'recipe-1', name: 'Masa clásica' }], error: null },
      production_order_items: {
        data: [
          {
            id: 'item-1',
            raw_material_id: 'material-1',
            planned_quantity: 4,
            consumed_quantity: 0,
            status: 'pending',
          },
        ],
        error: null,
      },
      raw_materials: {
        data: [{ id: 'material-1', name: 'Harina de trigo' }],
        error: null,
      },
    });

    const detail = await fetchMobileProductionDetail(client, 'order-1');

    expect(detail.order.production_number).toBe('OP-20260822-000001');
    expect(detail.items[0]?.raw_material?.name).toBe('Harina de trigo');
    expect(calls.map((call) => call.table)).toEqual([
      'production_orders',
      'recipes',
      'production_order_items',
      'raw_materials',
    ]);
  });

  it('rechaza órdenes inexistentes', async () => {
    const { client } = clientWith({
      production_orders: { data: null, error: null },
    });

    await expect(fetchMobileProductionDetail(client, 'missing')).rejects.toThrow(
      'Orden de producción no encontrada.',
    );
  });

  it('propaga errores de consultas relacionadas', async () => {
    const { client } = clientWith({
      production_orders: { data: [canonicalOrder], error: null },
      recipes: { data: null, error: { message: 'Recetas no disponibles.' } },
    });

    await expect(fetchMobileProductionOrders(client)).rejects.toThrow(
      'Recetas no disponibles.',
    );
  });
});
