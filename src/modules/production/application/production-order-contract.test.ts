import { describe, expect, it } from 'vitest';

import {
  assertProductionStatus,
  canCancelProductionOrder,
  calculateRequiredQuantity,
  sumAvailableStock,
  toProductionOrderState,
} from './production-order-contract';

describe('contrato tipado de órdenes de producción', () => {
  it.each(['draft', 'released', 'in_progress', 'completed', 'cancelled'])(
    'acepta estado canónico: %s',
    (status) => {
      expect(assertProductionStatus(status)).toBe(status);
    },
  );

  it.each(['', 'pending', null, 1])(
    'rechaza estado fuera del contrato: %j',
    (status) => {
      expect(() => assertProductionStatus(status)).toThrow(
        'Estado de producción fuera del contrato.',
      );
    },
  );

  it('permite cancelar únicamente órdenes draft o released', () => {
    expect(canCancelProductionOrder('draft')).toBe(true);
    expect(canCancelProductionOrder('released')).toBe(true);
    expect(canCancelProductionOrder('in_progress')).toBe(false);
  });

  it('calcula cantidades requeridas con valores exactos', () => {
    expect(calculateRequiredQuantity(2.5, 4)).toBe(10);
  });

  it('suma stock disponible y normaliza nulos', () => {
    expect(sumAvailableStock([{ quantity: 4 }, { quantity: null }])).toBe(4);
  });

  it('valida el estado al construir la vista operativa de una orden', () => {
    const state = toProductionOrderState({
      id: 'order-1',
      recipe_id: 'recipe-1',
      planned_quantity: 5,
      produced_quantity: null,
      production_status: 'released',
      notes: null,
    });

    expect(state.production_status).toBe('released');
  });
});
