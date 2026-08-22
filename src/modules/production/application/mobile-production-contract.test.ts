import { describe, expect, it } from 'vitest';

import {
  groupProductionItemStatuses,
  normalizeMobileProductionItem,
  normalizeMobileProductionOrder,
  normalizeMobileProductionSummary,
  uniqueProductionIds,
} from './mobile-production-contract';

const canonicalOrder = {
  id: 'order-1',
  production_number: 'OP-20260822-000001',
  recipe_id: 'recipe-1',
  planned_quantity: 12,
  produced_quantity: null,
  production_status: 'released',
  created_at: '2026-08-22T12:00:00.000Z',
};

const canonicalItem = {
  id: 'item-1',
  raw_material_id: 'material-1',
  planned_quantity: 4,
  consumed_quantity: 2,
  status: 'in_progress',
};

describe('contrato tipado de producción móvil', () => {
  it('conserva los nombres canónicos y normaliza la cantidad producida', () => {
    expect(normalizeMobileProductionOrder(canonicalOrder, 'Masa clásica')).toEqual({
      ...canonicalOrder,
      produced_quantity: 0,
      recipe_name: 'Masa clásica',
    });
  });

  it('muestra un marcador cuando la receta no está disponible', () => {
    expect(normalizeMobileProductionOrder(canonicalOrder, null).recipe_name).toBe('-');
  });

  it('rechaza estados de producción fuera del contrato', () => {
    expect(() =>
      normalizeMobileProductionOrder(
        { ...canonicalOrder, production_status: 'pending' },
        'Masa clásica',
      ),
    ).toThrow('Estado de producción fuera del contrato.');
  });

  it('calcula el avance con los estados reales de los items', () => {
    expect(
      normalizeMobileProductionSummary(canonicalOrder, 'Masa clásica', [
        { status: 'completed' },
        { status: 'pending' },
        { status: 'completed' },
      ]),
    ).toEqual({
      ...canonicalOrder,
      produced_quantity: 0,
      recipe_name: 'Masa clásica',
      total_items: 3,
      completed_items: 2,
    });
  });

  it('representa órdenes sin items con avance cero', () => {
    const summary = normalizeMobileProductionSummary(canonicalOrder, null, []);

    expect(summary.total_items).toBe(0);
    expect(summary.completed_items).toBe(0);
  });

  it('agrupa estados de items por orden de producción', () => {
    const groups = groupProductionItemStatuses([
      { production_order_id: 'order-1', status: 'completed' },
      { production_order_id: 'order-2', status: 'pending' },
      { production_order_id: 'order-1', status: 'in_progress' },
    ]);

    expect(groups.get('order-1')).toEqual([
      { status: 'completed' },
      { status: 'in_progress' },
    ]);
    expect(groups.get('order-2')).toEqual([{ status: 'pending' }]);
  });

  it('normaliza un item con su materia prima consultada explícitamente', () => {
    expect(
      normalizeMobileProductionItem(canonicalItem, {
        id: 'material-1',
        name: 'Harina de trigo',
      }),
    ).toEqual({
      ...canonicalItem,
      raw_material: {
        id: 'material-1',
        name: 'Harina de trigo',
      },
    });
  });

  it('conserva null cuando la materia prima no está disponible', () => {
    expect(normalizeMobileProductionItem(canonicalItem, null).raw_material).toBe(null);
  });

  it('deduplica identificadores sin modificar el orden original', () => {
    expect(uniqueProductionIds(['recipe-2', 'recipe-1', 'recipe-2'])).toEqual([
      'recipe-2',
      'recipe-1',
    ]);
  });
});
