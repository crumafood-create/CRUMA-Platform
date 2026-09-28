import { describe, expect, it } from 'vitest';

import {
  buildProductionMaterialConsumptionRequest,
} from './production-material-consumption-contract';

const VALID_INPUT = {
  productionOrderItemId:
    '11111111-1111-4111-8111-111111111111',
  scannedLotNumber: '  mp-lote-001  ',
  idempotencyKey:
    '22222222-2222-4222-8222-222222222222',
};

describe('contrato de consumo de materia prima', () => {
  it('normaliza una solicitud idempotente de consumo', () => {
    expect(
      buildProductionMaterialConsumptionRequest(
        VALID_INPUT,
      ),
    ).toEqual({
      productionOrderItemId:
        '11111111-1111-4111-8111-111111111111',
      scannedLotNumber: 'MP-LOTE-001',
      idempotencyKey:
        '22222222-2222-4222-8222-222222222222',
    });
  });

  it.each([
    '',
    'item-invalido',
    null,
  ])(
    'rechaza un artículo de producción inválido: %s',
    (productionOrderItemId) => {
      expect(() =>
        buildProductionMaterialConsumptionRequest({
          ...VALID_INPUT,
          productionOrderItemId,
        }),
      ).toThrow(
        'El artículo de producción no es válido.',
      );
    },
  );

  it.each([
    '',
    '   ',
    'LOTE INVÁLIDO',
    null,
  ])(
    'rechaza un lote escaneado inválido: %s',
    (scannedLotNumber) => {
      expect(() =>
        buildProductionMaterialConsumptionRequest({
          ...VALID_INPUT,
          scannedLotNumber,
        }),
      ).toThrow(
        'El lote escaneado no es válido.',
      );
    },
  );

  it.each([
    '',
    'clave-invalida',
    null,
  ])(
    'rechaza una clave de idempotencia inválida: %s',
    (idempotencyKey) => {
      expect(() =>
        buildProductionMaterialConsumptionRequest({
          ...VALID_INPUT,
          idempotencyKey,
        }),
      ).toThrow(
        'La clave de idempotencia no es válida.',
      );
    },
  );
});