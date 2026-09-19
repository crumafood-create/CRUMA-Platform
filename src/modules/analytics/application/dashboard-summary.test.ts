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
          { production_status: 'draft' },
          { production_status: 'completed' },
          { production_status: 'cancelled' },
        ],
        forecasts: [
          { suggested_production: 12 },
          { suggested_production: 0 },
        ],
      }),
    ).toEqual({
      salesMonth: 125.5,
      receivableBalance: 40,
      productCount: 1,
      materialCount: 1,
      criticalCount: 1,
      openProduction: 1,
      completedProduction: 1,
      productsToProduce: 1,
      suggestedProduction: 12,
    });
  });
});
