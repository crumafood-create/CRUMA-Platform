import { describe, expect, it } from 'vitest';

import {
  buildProductionCostRequest,
  calculateProductionCostTotals,
} from './production-cost-contract';

function form(labor = '20.25', overhead = '4.75'): FormData {
  const data = new FormData();
  data.set('labor_cost', labor);
  data.set('overhead_cost', overhead);
  return data;
}

describe('contrato de costos de producción', () => {
  it('normaliza los costos controlables', () => {
    expect(buildProductionCostRequest(form(), 'order-1')).toEqual({
      productionOrderId: 'order-1',
      laborCost: 20.25,
      overheadCost: 4.75,
    });
  });

  it.each([
    ['', '0'],
    ['-1', '0'],
    ['NaN', '0'],
    ['Infinity', '0'],
    ['0', '-1'],
    ['0', 'NaN'],
  ])('rechaza costos inválidos: %s, %s', (labor, overhead) => {
    expect(() => buildProductionCostRequest(form(labor, overhead), 'order-1'))
      .toThrow('Los costos deben ser números finitos no negativos.');
  });

  it('rechaza costos ausentes', () => {
    expect(() => buildProductionCostRequest(new FormData(), 'order-1')).toThrow(
      'Los costos deben ser números finitos no negativos.',
    );
  });

  it('calcula costo total y unitario a cuatro decimales', () => {
    expect(calculateProductionCostTotals(25, 20.25, 4.75, 10)).toEqual({
      materialCost: 25,
      laborCost: 20.25,
      overheadCost: 4.75,
      totalCost: 50,
      unitCost: 5,
    });
  });

  it('rechaza producción nula y valores negativos', () => {
    expect(() => calculateProductionCostTotals(10, 0, 0, 0)).toThrow(
      'La cantidad producida debe ser positiva.',
    );
    expect(() => calculateProductionCostTotals(-1, 0, 0, 10)).toThrow(
      'Los costos deben ser números finitos no negativos.',
    );
  });
});
