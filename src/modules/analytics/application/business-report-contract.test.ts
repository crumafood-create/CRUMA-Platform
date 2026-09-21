import { describe, expect, it } from 'vitest';

import { buildBusinessReport } from './business-report-contract';

describe('reporte ejecutivo P5', () => {
  it('consolida ventas, inventario, producción y comportamiento sin mutar la fuente', () => {
    const source = {
      sales: [
        { lineName: 'Congelados', productName: 'Tequeños', sku: 'PT-01', units: 10, revenue: 500 },
        { lineName: 'Congelados', productName: 'Empanadas', sku: 'PT-02', units: 4, revenue: 240 },
        { lineName: 'Masas', productName: 'Discos', sku: 'PT-03', units: 3, revenue: 150 },
      ],
      inventory: [
        { itemType: 'product' as const, name: 'Tequeños', sku: 'PT-01', quantity: 2, minimum: 5 },
        { itemType: 'raw_material' as const, name: 'Harina', sku: 'MP-01', quantity: 20, minimum: 10 },
        { itemType: 'product' as const, name: 'Empanadas', sku: 'PT-02', quantity: 0, minimum: 4 },
      ],
      production: [
        { planned: 100, produced: 80, status: 'completed' },
        { planned: 50, produced: 25, status: 'in_progress' },
      ],
      events: [
        { userId: 'user-1', sessionId: 'session-1', eventType: 'page_view', page: '/dashboard' },
        { userId: 'user-1', sessionId: 'session-1', eventType: 'page_view', page: '/reports' },
        { userId: null, sessionId: 'session-2', eventType: 'catalog_search', page: '/catalogo' },
      ],
    };
    const snapshot = structuredClone(source);

    const report = buildBusinessReport(source);

    expect(report.kpis).toEqual({
      revenue: 890,
      unitsSold: 17,
      trackedSkus: 3,
      lowStockSkus: 2,
      productionEfficiency: 70,
      activeUsers: 2,
    });
    expect(report.salesByLine).toEqual([
      { name: 'Congelados', revenue: 740, units: 14 },
      { name: 'Masas', revenue: 150, units: 3 },
    ]);
    expect(report.inventoryBySku[0]).toMatchObject({ sku: 'PT-02', status: 'out', shortage: 4 });
    expect(report.inventoryBySku[1]).toMatchObject({ sku: 'PT-01', status: 'critical', shortage: 3 });
    expect(report.production).toMatchObject({ planned: 150, produced: 105, completedOrders: 1 });
    expect(report.userBehavior.topPages[0]).toEqual({ page: '/catalogo', views: 1 });
    expect(source).toEqual(snapshot);
  });

  it('entrega porcentajes y colecciones seguras cuando no hay datos', () => {
    const report = buildBusinessReport({ sales: [], inventory: [], production: [], events: [] });

    expect(report.kpis).toMatchObject({ revenue: 0, productionEfficiency: 0, activeUsers: 0 });
    expect(report.salesByLine).toEqual([]);
    expect(report.userBehavior.topPages).toEqual([]);
  });
});
