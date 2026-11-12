import { describe, expect, it } from 'vitest';

import {
  buildProductionOrderMassStartRequest,
  buildProductionOrderCreationRequest,
  buildProductionOrderTransitionRequest,
} from './production-order-lifecycle-contract';

const UUIDS = {
  recipe:
    'b1000000-0000-4000-8000-000000000001',
  order:
    'b2000000-0000-4000-8000-000000000001',
  idempotency:
    'b3000000-0000-4000-8000-000000000001',
} as const;

const VALID_CREATION = {
  recipeId: UUIDS.recipe,
  plannedQuantity: 100,
  notes: '  Producción prioritaria  ',
  idempotencyKey: UUIDS.idempotency,
};

const VALID_TRANSITION = {
  productionOrderId: UUIDS.order,
  transition: 'release',
  reason: '  Material confirmado  ',
  idempotencyKey: UUIDS.idempotency,
};

describe(
  'contrato del ciclo de vida de órdenes de producción',
  () => {
    describe('creación atómica', () => {
      it(
        'normaliza una orden idempotente',
        () => {
          expect(
            buildProductionOrderCreationRequest(
              VALID_CREATION,
            ),
          ).toEqual({
            recipeId: UUIDS.recipe,
            plannedQuantity: 100,
            notes: 'Producción prioritaria',
            idempotencyKey:
              UUIDS.idempotency,
          });
        },
      );

      it(
        'normaliza notas vacías como null',
        () => {
          expect(
            buildProductionOrderCreationRequest({
              ...VALID_CREATION,
              notes: '   ',
            }),
          ).toEqual({
            recipeId: UUIDS.recipe,
            plannedQuantity: 100,
            notes: null,
            idempotencyKey:
              UUIDS.idempotency,
          });
        },
      );

      it.each([
        '',
        'recipe-invalid',
        null,
      ])(
        'rechaza una receta inválida: %s',
        (recipeId) => {
          expect(() =>
            buildProductionOrderCreationRequest({
              ...VALID_CREATION,
              recipeId,
            }),
          ).toThrow(
            'La receta no es válida.',
          );
        },
      );

      it.each([
        0,
        -1,
        1.5,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        '',
        null,
      ])(
        'rechaza una cantidad planeada inválida: %s',
        (plannedQuantity) => {
          expect(() =>
            buildProductionOrderCreationRequest({
              ...VALID_CREATION,
              plannedQuantity,
            }),
          ).toThrow(
            'La cantidad planeada debe ser un entero positivo.',
          );
        },
      );

      it(
        'rechaza notas excesivamente largas',
        () => {
          expect(() =>
            buildProductionOrderCreationRequest({
              ...VALID_CREATION,
              notes: 'x'.repeat(501),
            }),
          ).toThrow(
            'Las notas no pueden exceder 500 caracteres.',
          );
        },
      );

      it.each([
        '',
        'idempotency-invalid',
        null,
      ])(
        'rechaza una clave de creación inválida: %s',
        (idempotencyKey) => {
          expect(() =>
            buildProductionOrderCreationRequest({
              ...VALID_CREATION,
              idempotencyKey,
            }),
          ).toThrow(
            'La clave de idempotencia no es válida.',
          );
        },
      );
    });

    describe('transiciones atómicas', () => {
      it.each([
        ['release', 'Material confirmado'],
        ['start', 'Material confirmado'],
        ['cancel', 'Material confirmado'],
      ] as const)(
        'normaliza la transición %s',
        (transition, reason) => {
          expect(
            buildProductionOrderTransitionRequest({
              ...VALID_TRANSITION,
              transition,
            }),
          ).toEqual({
            productionOrderId:
              UUIDS.order,
            transition,
            reason,
            idempotencyKey:
              UUIDS.idempotency,
          });
        },
      );

      it.each([
        'release',
        'start',
      ] as const)(
        'permite %s sin motivo',
        (transition) => {
          expect(
            buildProductionOrderTransitionRequest({
              ...VALID_TRANSITION,
              transition,
              reason: '   ',
            }),
          ).toEqual({
            productionOrderId:
              UUIDS.order,
            transition,
            reason: null,
            idempotencyKey:
              UUIDS.idempotency,
          });
        },
      );

      it.each([
        '',
        'order-invalid',
        null,
      ])(
        'rechaza una orden inválida: %s',
        (productionOrderId) => {
          expect(() =>
            buildProductionOrderTransitionRequest({
              ...VALID_TRANSITION,
              productionOrderId,
            }),
          ).toThrow(
            'La orden de producción no es válida.',
          );
        },
      );

      it.each([
        '',
        'complete',
        'cancelled',
        null,
      ])(
        'rechaza una transición inválida: %s',
        (transition) => {
          expect(() =>
            buildProductionOrderTransitionRequest({
              ...VALID_TRANSITION,
              transition,
            }),
          ).toThrow(
            'La transición debe ser liberar, iniciar o cancelar.',
          );
        },
      );

      it.each([
        '',
        '   ',
        null,
      ])(
        'exige motivo para cancelar: %s',
        (reason) => {
          expect(() =>
            buildProductionOrderTransitionRequest({
              ...VALID_TRANSITION,
              transition: 'cancel',
              reason,
            }),
          ).toThrow(
            'El motivo de cancelación es obligatorio.',
          );
        },
      );

      it(
        'rechaza un motivo excesivamente largo',
        () => {
          expect(() =>
            buildProductionOrderTransitionRequest({
              ...VALID_TRANSITION,
              reason: 'x'.repeat(501),
            }),
          ).toThrow(
            'El motivo de la transición no puede exceder 500 caracteres.',
          );
        },
      );

      it.each([
        '',
        'idempotency-invalid',
        null,
      ])(
        'rechaza una clave de transición inválida: %s',
        (idempotencyKey) => {
          expect(() =>
            buildProductionOrderTransitionRequest({
              ...VALID_TRANSITION,
              idempotencyKey,
            }),
          ).toThrow(
            'La clave de idempotencia no es válida.',
          );
        },
      );
    });
  },
);

describe('contrato de apartado de masa al iniciar una orden', () => {
  it('normaliza pesos por lote en kg con precisión de cuatro decimales', () => {
    expect(buildProductionOrderMassStartRequest({
      productionOrderId: UUIDS.order,
      idempotencyKey: UUIDS.idempotency,
      lotReservations: [
        {
          productLotId: 'c1000000-0000-4000-8000-000000000001',
          quantity: 0.6,
        },
        {
          productLotId: 'c1000000-0000-4000-8000-000000000002',
          quantity: 0.45,
        },
      ],
    })).toEqual({
      productionOrderId: UUIDS.order,
      idempotencyKey: UUIDS.idempotency,
      lotReservations: [
        {
          productLotId: 'c1000000-0000-4000-8000-000000000001',
          quantity: 0.6,
        },
        {
          productLotId: 'c1000000-0000-4000-8000-000000000002',
          quantity: 0.45,
        },
      ],
    });
  });

  it('exige al menos un lote pesado', () => {
    expect(() => buildProductionOrderMassStartRequest({
      productionOrderId: UUIDS.order,
      idempotencyKey: UUIDS.idempotency,
      lotReservations: [],
    })).toThrow('Pesa la cantidad retirada de al menos un lote de masa.');
  });

  it.each([0, -0.1, 0.12345, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza una cantidad retirada inválida: %s kg',
    (quantity) => {
      expect(() => buildProductionOrderMassStartRequest({
        productionOrderId: UUIDS.order,
        idempotencyKey: UUIDS.idempotency,
        lotReservations: [{
          productLotId: 'c1000000-0000-4000-8000-000000000001',
          quantity,
        }],
      })).toThrow(
        'La cantidad retirada debe ser positiva y tener como máximo cuatro decimales en kg.',
      );
    },
  );

  it('rechaza lotes repetidos para evitar dos capturas del mismo recipiente', () => {
    expect(() => buildProductionOrderMassStartRequest({
      productionOrderId: UUIDS.order,
      idempotencyKey: UUIDS.idempotency,
      lotReservations: [
        {
          productLotId: 'c1000000-0000-4000-8000-000000000001',
          quantity: 0.5,
        },
        {
          productLotId: 'c1000000-0000-4000-8000-000000000001',
          quantity: 0.55,
        },
      ],
    })).toThrow('No repitas el mismo lote de masa.');
  });
});
