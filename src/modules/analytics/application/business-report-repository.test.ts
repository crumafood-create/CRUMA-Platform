import { describe, expect, it, vi } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { loadBusinessReport } from './business-report-repository';

function reportClient(errorTable?: string, sparse = false) {
  const calls = new Map<string, Array<{ method: string; args: unknown[] }>>();
  const fixtures: Record<string, unknown[]> = sparse ? {
    business_sales_by_line: [{ line_name: null, product_name: null, sku: null, units: null, revenue: null }],
    business_inventory_by_sku: [
      { item_type: 'unknown', item_name: null, sku: null, quantity: null, minimum: null },
      { item_type: 'raw_material', item_name: null, sku: null, quantity: null, minimum: null },
    ],
    business_production_rates: [{ planned: null, produced: null, status: null }],
    analytics_events: [{ user_id: null, session_id: null, event_type: 'page_view', page: null }],
  } : {
    business_sales_by_line: [{ line_name: 'Congelados', product_name: 'Tequeños', sku: 'PT-01', units: 10, revenue: 500 }],
    business_inventory_by_sku: [{ item_type: 'product', item_name: 'Tequeños', sku: 'PT-01', quantity: 2, minimum: 5 }],
    business_production_rates: [{ planned: 100, produced: 80, status: 'completed' }],
    analytics_events: [{ user_id: 'user-1', session_id: 'session-1', event_type: 'page_view', page: '/dashboard' }],
  };
  const from = vi.fn((table: string) => {
    const operations = calls.get(table) ?? [];
    calls.set(table, operations);
    const query: Record<string, unknown> = {};
    for (const method of ['select', 'gte', 'lte', 'order']) {
      query[method] = (...args: unknown[]) => {
        operations.push({ method, args });
        return query;
      };
    }
    query.then = (resolve: (result: unknown) => unknown) => Promise.resolve({
      data: fixtures[table] ?? [],
      error: table === errorTable ? { code: 'PGRST500', message: 'provider detail' } : null,
    }).then(resolve);
    return query;
  });
  return { client: { from } as unknown as TypedSupabaseClient, calls, from };
}

describe('repositorio de analítica de negocio', () => {
  it('consulta cuatro fuentes agregadas en paralelo y aplica el periodo', async () => {
    const { client, calls, from } = reportClient();
    const report = await loadBusinessReport(client, { from: '2026-09-01', to: '2026-09-19' });

    expect(from).toHaveBeenCalledTimes(4);
    expect(calls.get('business_sales_by_line')).toContainEqual({ method: 'gte', args: ['day', '2026-09-01'] });
    expect(calls.get('business_production_rates')).toContainEqual({ method: 'lte', args: ['day', '2026-09-19'] });
    expect(calls.get('analytics_events')).toContainEqual({ method: 'gte', args: ['created_at', '2026-09-01T00:00:00.000Z'] });
    expect(report.kpis).toMatchObject({ revenue: 500, lowStockSkus: 1, productionEfficiency: 80 });
  });

  it('normaliza errores sin filtrar el mensaje del proveedor', async () => {
    const { client } = reportClient('analytics_events');

    await expect(loadBusinessReport(client, { from: '2026-09-01', to: '2026-09-19' }))
      .rejects.toThrow('No fue posible cargar analítica de negocio.');
  });

  it('tolera valores nulos y descarta tipos de inventario desconocidos', async () => {
    const { client } = reportClient(undefined, true);
    const report = await loadBusinessReport(client, { from: '2026-09-01', to: '2026-09-19' });

    expect(report.salesByLine[0]).toEqual({ name: 'Sin línea', revenue: 0, units: 0 });
    expect(report.inventoryBySku).toEqual([
      expect.objectContaining({ itemType: 'raw_material', name: 'Sin nombre', sku: 'SIN-SKU' }),
    ]);
    expect(report.production).toMatchObject({ planned: 0, produced: 0, efficiency: 0 });
  });
});
