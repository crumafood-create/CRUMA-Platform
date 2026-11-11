import { describe, expect, it } from 'vitest';

import {
  buildProductionMassLotSurplusRequest,
  buildProductionOutputCompletionRequest,
} from './production-output-completion-contract';

const VALID_INPUT = {
  productionOrderId:
    '11111111-1111-4111-8111-111111111111',
  producedQuantity: 87,
  wasteQuantity: 13,
  varianceReason: 'Merma por recorte',
  idempotencyKey:
    '33333333-3333-4333-8333-333333333333',
};

describe(
  'contrato de cierre de producción',
  () => {
    it(
      'normaliza una salida terminada idempotente',
      () => {
        expect(
          buildProductionOutputCompletionRequest(
            VALID_INPUT,
          ),
        ).toEqual({
          productionOrderId:
            '11111111-1111-4111-8111-111111111111',
          producedQuantity: 87,
          wasteQuantity: 13,
          varianceReason:
            'Merma por recorte',
          idempotencyKey:
            '33333333-3333-4333-8333-333333333333',
        });
      },
    );

    it(
      'normaliza una conciliación sin variación',
      () => {
        expect(
          buildProductionOutputCompletionRequest({
            ...VALID_INPUT,
            wasteQuantity: 0,
            varianceReason: '   ',
          }),
        ).toEqual({
          productionOrderId:
            '11111111-1111-4111-8111-111111111111',
          producedQuantity: 87,
          wasteQuantity: 0,
          varianceReason: null,
          idempotencyKey:
            '33333333-3333-4333-8333-333333333333',
        });
      },
    );

    it.each([
      '',
      'orden-invalida',
      null,
    ])(
      'rechaza una orden inválida: %s',
      (productionOrderId) => {
        expect(() =>
          buildProductionOutputCompletionRequest({
            ...VALID_INPUT,
            productionOrderId,
          }),
        ).toThrow(
          'La orden de producción no es válida.',
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
    ])(
      'rechaza una cantidad producida inválida: %s',
      (producedQuantity) => {
        expect(() =>
          buildProductionOutputCompletionRequest({
            ...VALID_INPUT,
            producedQuantity,
          }),
        ).toThrow(
          'La cantidad producida debe ser un entero positivo.',
        );
      },
    );

    it.each([
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      '',
      null,
    ])(
      'rechaza una cantidad de merma inválida: %s',
      (wasteQuantity) => {
        expect(() =>
          buildProductionOutputCompletionRequest({
            ...VALID_INPUT,
            wasteQuantity,
          }),
        ).toThrow(
          'La cantidad de merma debe ser un entero no negativo.',
        );
      },
    );

    it.each([
      '',
      '   ',
      null,
    ])(
      'exige motivo cuando existe merma: %s',
      (varianceReason) => {
        expect(() =>
          buildProductionOutputCompletionRequest({
            ...VALID_INPUT,
            varianceReason,
          }),
        ).toThrow(
          'El motivo de la variación es obligatorio cuando existe merma.',
        );
      },
    );

    it(
      'rechaza un motivo excesivamente largo',
      () => {
        expect(() =>
          buildProductionOutputCompletionRequest({
            ...VALID_INPUT,
            varianceReason: 'x'.repeat(501),
          }),
        ).toThrow(
          'El motivo de la variación no puede exceder 500 caracteres.',
        );
      },
    );

    it.each([
      '',
      'clave-invalida',
      null,
    ])(
      'rechaza una clave idempotente inválida: %s',
      (idempotencyKey) => {
        expect(() =>
          buildProductionOutputCompletionRequest({
            ...VALID_INPUT,
            idempotencyKey,
          }),
        ).toThrow(
          'La clave de idempotencia no es válida.',
        );
      },
    );
  },
);

describe('contrato de sobrantes de masa por lote', () => {
  it('normaliza el cierre planeado de 50 Party con 48 piezas reales y dos lotes', () => {
    expect(buildProductionMassLotSurplusRequest({
      ...VALID_INPUT,
      producedQuantity: 48,
      wasteQuantity: 2,
      varianceReason: 'Variación de rendimiento',
      lotSurpluses: [
        { productLotId: '55555555-5555-4555-8555-555555555555', surplusQuantity: '0.1000' },
        { productLotId: '66666666-6666-4666-8666-666666666666', surplusQuantity: '0.05' },
      ],
    })).toMatchObject({
      producedQuantity: 48,
      wasteQuantity: 2,
      lotSurpluses: [
        { productLotId: '55555555-5555-4555-8555-555555555555', surplusQuantity: 0.1 },
        { productLotId: '66666666-6666-4666-8666-666666666666', surplusQuantity: 0.05 },
      ],
    });
  });

  it.each([
    { productLotId: '55555555-5555-4555-8555-555555555555', surplusQuantity: '-0.1' },
    { productLotId: '55555555-5555-4555-8555-555555555555', surplusQuantity: '0.00001' },
    { productLotId: 'invalid', surplusQuantity: 0 },
  ])('rechaza sobrantes inválidos por lote: %o', (surplus) => {
    expect(() => buildProductionMassLotSurplusRequest({
      ...VALID_INPUT,
      lotSurpluses: [surplus],
    })).toThrow();
  });

  it('rechaza IDs de lote repetidos y una lista vacía', () => {
    const surplus = { productLotId: '55555555-5555-4555-8555-555555555555', surplusQuantity: 0 };
    expect(() => buildProductionMassLotSurplusRequest({ ...VALID_INPUT, lotSurpluses: [] })).toThrow('Registra el sobrante de cada lote de masa.');
    expect(() => buildProductionMassLotSurplusRequest({ ...VALID_INPUT, lotSurpluses: [surplus, surplus] })).toThrow('Registra cada lote de masa una sola vez.');
  });
});
