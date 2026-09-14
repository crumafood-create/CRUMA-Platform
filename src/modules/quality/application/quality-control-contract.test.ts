import { describe, expect, it } from 'vitest';

import {
  assertQualityDecision,
  buildQualityInspectionRequest,
} from './quality-control-contract';

function validForm(): FormData {
  const data = new FormData();
  data.set('production_output_id', 'output-1');
  data.set('sampled_quantity', '10');
  data.set('notes', 'Muestra de liberación');
  data.set('criterion_1', 'Apariencia');
  data.set('expected_1', 'Uniforme');
  data.set('actual_1', 'Uniforme');
  data.set('passed_1', 'on');
  return data;
}

describe('contrato de control de calidad', () => {
  it('normaliza una inspección con criterios y defectos opcionales', () => {
    expect(buildQualityInspectionRequest(validForm())).toEqual({
      productionOutputId: 'output-1',
      sampledQuantity: 10,
      notes: 'Muestra de liberación',
      criteria: [{
        criterion: 'Apariencia',
        expectedValue: 'Uniforme',
        actualValue: 'Uniforme',
        passed: true,
      }],
      defects: [],
    });
  });

  it.each(['0', '-1', '1.5', 'NaN'])('rechaza tamaño de muestra inválido: %s', (value) => {
    const data = validForm();
    data.set('sampled_quantity', value);
    expect(() => buildQualityInspectionRequest(data)).toThrow(
      'La cantidad muestreada debe ser un entero positivo.',
    );
  });

  it('exige al menos un criterio y valida el defecto', () => {
    const empty = validForm();
    empty.delete('criterion_1');
    expect(() => buildQualityInspectionRequest(empty)).toThrow(
      'La inspección requiere al menos un criterio.',
    );

    const defect = validForm();
    defect.set('defect_type', 'Sellado abierto');
    defect.set('defect_severity', 'critical');
    defect.set('defect_quantity', '11');
    expect(() => buildQualityInspectionRequest(defect)).toThrow(
      'La cantidad defectuosa no puede superar la muestra.',
    );
  });

  it('limita las decisiones de liberación', () => {
    expect(assertQualityDecision('release')).toBe('release');
    expect(assertQualityDecision('hold')).toBe('hold');
    expect(assertQualityDecision('reject')).toBe('reject');
    expect(() => assertQualityDecision('passed')).toThrow(
      'La decisión de calidad no es válida.',
    );
  });
});
