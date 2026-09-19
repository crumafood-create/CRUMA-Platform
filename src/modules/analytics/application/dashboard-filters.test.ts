import { describe, expect, it } from 'vitest';

import { parseDashboardFilters } from './dashboard-filters';

describe('filtros del dashboard ejecutivo', () => {
  it('usa los últimos 30 días como rango seguro y conserva filtros válidos', () => {
    expect(
      parseDashboardFilters(
        { period: '30d', user: 'user-1', warehouse: 'warehouse-1' },
        new Date('2026-09-19T12:00:00.000Z'),
      ),
    ).toEqual({
      from: '2026-08-21T00:00:00.000Z',
      to: '2026-09-19T23:59:59.999Z',
      period: '30d',
      userId: 'user-1',
      warehouseId: 'warehouse-1',
    });
  });

  it('acepta un rango personalizado completo', () => {
    expect(
      parseDashboardFilters(
        { period: 'custom', from: '2026-09-01', to: '2026-09-15' },
        new Date('2026-09-19T12:00:00.000Z'),
      ),
    ).toMatchObject({
      from: '2026-09-01T00:00:00.000Z',
      to: '2026-09-15T23:59:59.999Z',
      period: 'custom',
    });
  });

  it('descarta identificadores manipulados y rangos incompletos', () => {
    expect(
      parseDashboardFilters(
        { period: 'custom', from: 'ayer', user: '<script>' },
        new Date('2026-09-19T12:00:00.000Z'),
      ),
    ).toMatchObject({ period: '30d', userId: null, warehouseId: null });
  });
});
