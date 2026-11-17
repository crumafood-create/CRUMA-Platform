import { describe, expect, it } from 'vitest';

import type { MobileProductionOrderSummary } from '@/modules/production/application/mobile-production-contract';

import { toProductionOrderSummaries } from './production.service';

const order = (
  production_status: string,
): MobileProductionOrderSummary => ({
  id: `order-${production_status}`,
  production_number: `OP-${production_status}`,
  recipe_id: 'recipe-1',
  planned_quantity: 2,
  produced_quantity: 0,
  production_status: production_status as MobileProductionOrderSummary['production_status'],
  created_at: '2026-11-16T12:00:00.000Z',
  recipe_name: 'Receta Masa estándar CRUMAFOOD',
  total_items: 5,
  completed_items: 0,
});

describe('adaptador de órdenes para la lista móvil de producción', () => {
  it('muestra las órdenes liberadas o en producción usando el contrato vigente', () => {
    expect(
      toProductionOrderSummaries([
        order('draft'),
        order('released'),
        order('in_progress'),
        order('completed'),
      ]),
    ).toEqual([
      {
        id: 'order-released',
        order_number: 'OP-released',
        product_name: 'Receta Masa estándar CRUMAFOOD',
        quantity: 2,
        status: 'released',
        created_at: '2026-11-16T12:00:00.000Z',
      },
      {
        id: 'order-in_progress',
        order_number: 'OP-in_progress',
        product_name: 'Receta Masa estándar CRUMAFOOD',
        quantity: 2,
        status: 'in_progress',
        created_at: '2026-11-16T12:00:00.000Z',
      },
    ]);
  });
});
