import { describe, expect, it } from 'vitest';

import {
  buildProductionCostRequest,
  calculateProductionCostTotals,
} from './production-cost-contract';

const UUIDS = {
  productionOrder:
    'c6000000-0000-4000-8000-000000000001',
  idempotency:
    'c8000000-0000-4000-8000-000000000001',
} as const;

function form(
  labor = '20.25',
  overhead = '4.75',
  idempotencyKey: string | null =
    UUIDS.idempotency,
): FormData {
  const data = new FormData();

  data.set('labor_cost', labor);
  data.set('overhead_cost', overhead);

  if (idempotencyKey !== null) {
    data.set(
      'idempotency_key',
      idempotencyKey,
    );
  }

  return data;
}

describe(
  'contrato de cierre de costos de producción',
  () => {
    it(
      'normaliza un cierre idempotente',
      () => {
        expect(
          buildProductionCostRequest(
            form(),
            `  ${UUIDS.productionOrder.toUpperCase()}  `,
          ),
        ).toEqual({
          productionOrderId:
            UUIDS.productionOrder,
          laborCost: 20.25,
          overheadCost: 4.75,
          idempotencyKey:
            UUIDS.idempotency,
        });
      },
    );

    it.each([
      '',
      'order-1',
      null,
    ])(
      'rechaza una orden inválida: %s',
      (productionOrderId) => {
        expect(() =>
          buildProductionCostRequest(
            form(),
            productionOrderId,
          ),
        ).toThrow(
          'La orden de producción no es válida.',
        );
      },
    );

    it.each([
      ['', '0'],
      ['-1', '0'],
      ['NaN', '0'],
      ['Infinity', '0'],
      ['0', '-1'],
      ['0', 'NaN'],
    ])(
      'rechaza costos inválidos: %s, %s',
      (labor, overhead) => {
        expect(() =>
          buildProductionCostRequest(
            form(labor, overhead),
            UUIDS.productionOrder,
          ),
        ).toThrow(
          'Los costos deben ser números finitos no negativos.',
        );
      },
    );

    it(
      'rechaza costos ausentes',
      () => {
        const data = new FormData();

        data.set(
          'idempotency_key',
          UUIDS.idempotency,
        );

        expect(() =>
          buildProductionCostRequest(
            data,
            UUIDS.productionOrder,
          ),
        ).toThrow(
          'Los costos deben ser números finitos no negativos.',
        );
      },
    );

    it.each([
      '',
      'idempotency-invalid',
      null,
    ])(
      'rechaza una clave idempotente inválida: %s',
      (idempotencyKey) => {
        expect(() =>
          buildProductionCostRequest(
            form(
              '20.25',
              '4.75',
              idempotencyKey,
            ),
            UUIDS.productionOrder,
          ),
        ).toThrow(
          'La clave de idempotencia no es válida.',
        );
      },
    );

    it(
      'calcula costo total y unitario a cuatro decimales',
      () => {
        expect(
          calculateProductionCostTotals(
            25,
            20.25,
            4.75,
            10,
          ),
        ).toEqual({
          materialCost: 25,
          laborCost: 20.25,
          overheadCost: 4.75,
          totalCost: 50,
          unitCost: 5,
        });
      },
    );

    it(
      'rechaza producción nula y valores negativos',
      () => {
        expect(() =>
          calculateProductionCostTotals(
            10,
            0,
            0,
            0,
          ),
        ).toThrow(
          'La cantidad producida debe ser positiva.',
        );

        expect(() =>
          calculateProductionCostTotals(
            -1,
            0,
            0,
            10,
          ),
        ).toThrow(
          'Los costos deben ser números finitos no negativos.',
        );
      },
    );
  },
);
