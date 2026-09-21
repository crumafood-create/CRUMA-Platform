import { describe, expect, it } from 'vitest';

import { toBusinessReportCsv, toBusinessReportPdf } from './business-report-export';

const report = {
  kpis: {
    revenue: 890,
    unitsSold: 17,
    trackedSkus: 2,
    lowStockSkus: 1,
    productionEfficiency: 70,
    activeUsers: 2,
  },
  salesByLine: [{ name: 'Congelados, retail', revenue: 740, units: 14 }],
  inventoryBySku: [{ itemType: 'product' as const, name: 'Tequeños', sku: 'PT-01', quantity: 2, minimum: 5, status: 'critical' as const, shortage: 3 }],
  production: { planned: 150, produced: 105, efficiency: 70, completedOrders: 1, totalOrders: 2 },
  userBehavior: { activeUsers: 2, sessions: 2, events: 3, topPages: [{ page: '/dashboard', views: 2 }] },
};

describe('exportación del reporte ejecutivo', () => {
  it('genera CSV UTF-8 compatible con Excel y escapa dimensiones', () => {
    const csv = toBusinessReportCsv(report, { from: '2026-09-01', to: '2026-09-19' });

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('periodo_desde,periodo_hasta,seccion,indicador,dimension,valor');
    expect(csv).toContain('ventas,ingresos_por_linea,"Congelados, retail",740');
  });

  it('genera un PDF descargable válido con título y periodo', () => {
    const pdf = toBusinessReportPdf(report, { from: '2026-09-01', to: '2026-09-19' });
    const text = new TextDecoder().decode(pdf);

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('CRUMAFOOD - Reporte ejecutivo');
    expect(text).toContain('2026-09-01 a 2026-09-19');
    expect(text.endsWith('%%EOF\n')).toBe(true);
  });
});
