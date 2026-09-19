import { describe, expect, it, vi } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { loadDashboardView } from './dashboard-repository';

type Operation = { method: string; args: unknown[] };

function dashboardClient(errorTable?: string) {
  const calls = new Map<string, Operation[]>();
  const data: Record<string, unknown[]> = {
    sales_orders: [{ total: 250 }],
    accounts_receivable: [{ balance: 90 }],
    inventory_stock_by_item: [
      { item_type: 'product', item_id: 'product-1', quantity: 1, warehouse_id: 'warehouse-1' },
    ],
    production_orders: [{ production_status: 'in_progress', planned_start_at: null }],
    demand_forecasts: [{ suggested_production: 20 }],
    products: [{ id: 'product-1', name: 'Tequeños', internal_code: 'PT-TEQ', min_stock: 5 }],
    raw_materials: [],
    warehouses: [{ id: 'warehouse-1', name: 'Principal' }],
    profiles: [{ id: 'user-1', full_name: 'Operación', email: null }],
  };

  const from = vi.fn((table: string) => {
    const operations = calls.get(table) ?? [];
    calls.set(table, operations);
    const builder: Record<string, unknown> = {};
    for (const method of ['select', 'gte', 'lte', 'eq', 'order', 'in']) {
      builder[method] = (...args: unknown[]) => {
        operations.push({ method, args });
        return builder;
      };
    }
    builder.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({
        data: data[table] ?? [],
        error: table === errorTable ? { code: 'PGRST500', message: 'provider detail' } : null,
      }).then(resolve);
    return builder;
  });

  return {
    calls,
    client: { from } as unknown as TypedSupabaseClient,
  };
}

describe('carga optimizada del dashboard', () => {
  it('comparte una sola lectura de stock entre métricas y alertas', async () => {
    const { client, calls } = dashboardClient();
    const view = await loadDashboardView(client, {
      from: '2026-09-01T00:00:00.000Z',
      to: '2026-09-19T23:59:59.999Z',
      period: 'custom',
      userId: 'user-1',
      warehouseId: 'warehouse-1',
    }, new Date('2026-09-19T12:00:00Z'));

    expect(calls.get('inventory_stock_by_item')?.filter((call) => call.method === 'select')).toHaveLength(1);
    expect(calls.get('inventory_stock_by_item')).toContainEqual({ method: 'select', args: ['item_type, item_id, quantity'] });
    expect(calls.get('inventory_stock_by_item')).toContainEqual({ method: 'eq', args: ['warehouse_id', 'warehouse-1'] });
    expect(calls.get('production_orders')).toContainEqual({ method: 'eq', args: ['created_by', 'user-1'] });
    expect(calls.get('sales_orders')).toContainEqual({ method: 'gte', args: ['created_at', '2026-09-01T00:00:00.000Z'] });
    expect(view.summary.salesMonth).toBe(250);
    expect(view.alerts[0]).toMatchObject({ item_id: 'product-1', minimum: 5 });
    expect(view.options.warehouses).toHaveLength(1);
  });

  it('convierte un fallo Supabase en un mensaje estable sin silenciarlo', async () => {
    const { client } = dashboardClient('sales_orders');
    await expect(loadDashboardView(client, {
      from: '2026-09-01T00:00:00.000Z',
      to: '2026-09-19T23:59:59.999Z',
      period: 'custom',
      userId: null,
      warehouseId: null,
    })).rejects.toThrow('No fue posible cargar indicadores del dashboard.');
  });
});
