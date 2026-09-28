import { describe, expect, it } from 'vitest';

import {
  buildRawMaterialQualityInspectionRequest,
} from './quality-control-contract';

function validForm(): FormData {
  const data = new FormData();

  data.set(
    'raw_material_lot_id',
    'a1000000-0000-0000-0000-000000000001',
  );

  data.set('sampled_quantity', '0.125');
  data.set('notes', 'Muestra tomada en recepción');
  data.set('criterion_1', 'Apariencia');
  data.set('expected_1', 'Sin contaminación visible');
  data.set('actual_1', 'Sin contaminación visible');
  data.set('passed_1', 'on');

  return data;
}

describe('contrato de calidad de materia prima', () => {
  it('normaliza una inspección con cantidad decimal', () => {
    expect(
      buildRawMaterialQualityInspectionRequest(
        validForm(),
      ),
    ).toEqual({
      rawMaterialLotId:
        'a1000000-0000-0000-0000-000000000001',
      sampledQuantity: 0.125,
      notes: 'Muestra tomada en recepción',
      criteria: [
        {
          criterion: 'Apariencia',
          expectedValue:
            'Sin contaminación visible',
          actualValue:
            'Sin contaminación visible',
          passed: true,
        },
      ],
      defects: [],
    });
  });

  it.each([
    '0',
    '-1',
    'NaN',
    'Infinity',
  ])(
    'rechaza una cantidad muestreada inválida: %s',
    (quantity) => {
      const data = validForm();

      data.set('sampled_quantity', quantity);

      expect(() =>
        buildRawMaterialQualityInspectionRequest(
          data,
        ),
      ).toThrow(
        'La cantidad muestreada debe ser positiva y finita.',
      );
    },
  );

  it('exige el lote de materia prima', () => {
    const data = validForm();

    data.delete('raw_material_lot_id');

    expect(() =>
      buildRawMaterialQualityInspectionRequest(data),
    ).toThrow(
      'El lote de materia prima es obligatorio.',
    );
  });

  it('exige al menos un criterio de inspección', () => {
    const data = validForm();

    data.delete('criterion_1');

    expect(() =>
      buildRawMaterialQualityInspectionRequest(data),
    ).toThrow(
      'La inspección requiere al menos un criterio.',
    );
  });
});