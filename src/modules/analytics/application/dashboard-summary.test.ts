import { describe, expect, it } from 'vitest';

import { buildDashboardSummary } from './dashboard-summary';

describe('resumen ejecutivo', () => {
  it('calcula indicadores sin depender de React ni Supabase', () => {
    expect(
      buildDashboardSummary({
        sales: [{ total: 100 }, { total: '25.50' }],
        receivables: [{ balance: 40 }],
        stock: [
          { item_type: 'product', quantity: 3 },
          { item_type: 'raw_material', quantity: 5 },
          { item_type: 'raw_material', quantity: 0 },
        ],
        production: [
          { production_status: 'draft', planned_start_at: '2026-09-01T08:00:00Z' },
          { production_status: 'completed', planned_start_at: null },
          { production_status: 'cancelled', planned_start_at: null },
        ],
        forecasts: [
          { suggested_production: 12 },
          { suggested_production: 0 },
        ],
      }, new Date('2026-09-19T12:00:00Z')),
    ).toEqual({
      salesMonth: 125.5,
      receivableBalance: 40,
      productCount: 1,
      materialCount: 1,
      criticalCount: 1,
      openProduction: 1,
      completedProduction: 1,
      delayedProduction: 1,
      productsToProduce: 1,
      suggestedProduction: 12,
    });
  });
});
