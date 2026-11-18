import { describe, expect, it } from 'vitest';

import { buildCheeseCutRequest, buildCheeseGratingRequest } from './cheese-preparation-contract';

const ids = {
  sourceLot: 'd2b850b5-a846-4c43-968e-1bcb680f9d07',
  sticks: '4e9f0179-72f4-4ca2-b4a4-6f2a655d727d',
  trim: 'e25d92b4-3df8-4ec4-83a9-5b12b6d77e01',
  key: '3dad1eb4-8f6f-4a98-8bca-5a2df11f93f5',
  grated: '8003c1c5-65fc-4d1f-9f29-58e8ee5b5134',
};

function cutForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  Object.entries({
    source_lot_id: ids.sourceLot,
    presentation: 'party',
    stick_material_id: ids.sticks,
    trim_material_id: ids.trim,
    source_quantity_kg: '0.907',
    piece_count: '65',
    stick_weight_kg: '0.650',
    trim_weight_kg: '0.245',
    waste_weight_kg: '0.012',
    idempotency_key: ids.key,
    reason: 'Pesos reales de prueba',
    ...overrides,
  }).forEach(([key, value]) => form.set(key, value));
  return form;
}

describe('cheese preparation contracts', () => {
  it('builds a measured Party cheese cut request without changing units', () => {
    expect(buildCheeseCutRequest(cutForm())).toMatchObject({
      presentation: 'party',
      sourceQuantityKg: 0.907,
      pieceCount: 65,
      stickWeightKg: 0.65,
      trimWeightKg: 0.245,
      wasteWeightKg: 0.012,
    });
  });

  it('rejects cut outputs that exceed the measured input and duplicate destinations', () => {
    expect(() => buildCheeseCutRequest(cutForm({ waste_weight_kg: '0.013' })))
      .toThrow('exceden el peso');
    expect(() => buildCheeseCutRequest(cutForm({ trim_material_id: ids.sticks })))
      .toThrow('existencias distintas');
  });

  it('rejects fractional stick counts and more than four decimal places', () => {
    expect(() => buildCheeseCutRequest(cutForm({ piece_count: '65.5' })))
      .toThrow('entero');
    expect(() => buildCheeseCutRequest(cutForm({ stick_weight_kg: '0.65001' })))
      .toThrow('cuatro decimales');
  });

  it('builds a grating request with separately measured waste', () => {
    const form = new FormData();
    form.set('trim_lot_id', ids.sourceLot);
    form.set('grated_material_id', ids.grated);
    form.set('source_quantity_kg', '0.245');
    form.set('grated_weight_kg', '0.237');
    form.set('waste_weight_kg', '0.008');
    form.set('idempotency_key', ids.key);
    form.set('reason', 'Rallado medido');
    expect(buildCheeseGratingRequest(form)).toMatchObject({
      gratedWeightKg: 0.237,
      sourceQuantityKg: 0.245,
      wasteWeightKg: 0.008,
    });
  });

  it('rejects grating outputs that exceed the weighed trim input', () => {
    const form = new FormData();
    form.set('trim_lot_id', ids.sourceLot);
    form.set('grated_material_id', ids.grated);
    form.set('source_quantity_kg', '0.245');
    form.set('grated_weight_kg', '0.238');
    form.set('waste_weight_kg', '0.008');
    form.set('idempotency_key', ids.key);
    form.set('reason', 'Rallado medido');
    expect(() => buildCheeseGratingRequest(form)).toThrow('exceden el peso');
  });
});
