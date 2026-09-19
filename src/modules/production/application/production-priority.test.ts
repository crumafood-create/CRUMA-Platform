import { describe, expect, it } from 'vitest';

import { getProductionPriority } from './production-priority';

describe('prioridad operativa de producción', () => {
  it('prioriza una orden atrasada que todavía no inicia', () => {
    expect(getProductionPriority({
      status: 'released',
      plannedStartAt: '2026-09-18T08:00:00Z',
      plannedQuantity: 100,
      producedQuantity: 0,
    }, new Date('2026-09-19T12:00:00Z'))).toEqual({
      isDelayed: true,
      progress: 0,
      tone: 'critical',
      label: 'Atrasada',
    });
  });

  it('calcula el avance sin exceder cien por ciento', () => {
    expect(getProductionPriority({
      status: 'in_progress',
      plannedStartAt: null,
      plannedQuantity: 10,
      producedQuantity: 12,
    }, new Date('2026-09-19T12:00:00Z')).progress).toBe(100);
  });
});
