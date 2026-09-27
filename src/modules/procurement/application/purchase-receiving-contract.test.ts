import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  parsePurchaseReceivingInput,
  purchaseReceivingInputSchema,
} from './purchase-receiving-contract';

const VALID_INPUT = {
  purchaseOrderItemId:
    '11111111-1111-4111-8111-111111111111',
  quantityReceived: 4,
  lotNumber: '  MP-2026-001  ',
  expirationDate: '2027-09-27',
  inventoryLocationId:
    '22222222-2222-4222-8222-222222222222',
  idempotencyKey:
    '33333333-3333-4333-8333-333333333333',
};

describe('contrato de recepción de compras', () => {
  it('acepta una recepción parcial y normaliza el lote', () => {
    expect(
      parsePurchaseReceivingInput(VALID_INPUT),
    ).toEqual({
      ...VALID_INPUT,
      lotNumber: 'MP-2026-001',
    });
  });

  it.each([
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])(
    'rechaza una cantidad inválida: %s',
    (quantityReceived) => {
      expect(
        purchaseReceivingInputSchema.safeParse({
          ...VALID_INPUT,
          quantityReceived,
        }).success,
      ).toBe(false);
    },
  );

  it.each([
    '',
    '27-09-2027',
    '2027-02-30',
  ])(
    'rechaza una caducidad inválida: %s',
    (expirationDate) => {
      expect(
        purchaseReceivingInputSchema.safeParse({
          ...VALID_INPUT,
          expirationDate,
        }).success,
      ).toBe(false);
    },
  );

  it('rechaza una clave de idempotencia inválida', () => {
    expect(
      purchaseReceivingInputSchema.safeParse({
        ...VALID_INPUT,
        idempotencyKey: 'not-a-uuid',
      }).success,
    ).toBe(false);
  });
});