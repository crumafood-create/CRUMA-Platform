import { describe, expect, it } from 'vitest';

import { buildFEFOAllocation } from './production-fefo';

describe('snapshot de costo FEFO', () => {
  it('conserva el costo real del lote en cada asignación', () => {
    const allocations = buildFEFOAllocation([{
      id: 'lot-1',
      raw_material_id: 'material-1',
      lot_number: 'LOT-1',
      quantity: 10,
      unit_cost: 12.5,
      expiration_date: '2026-10-01',
      created_at: '2026-09-14T00:00:00Z',
    }], 2);

    expect(allocations[0]).toMatchObject({
      quantity: 2,
      unit_cost: 12.5,
      total_cost: 25,
    });
  });
});
