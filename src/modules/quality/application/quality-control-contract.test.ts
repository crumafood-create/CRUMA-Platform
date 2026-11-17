import { describe, expect, it } from 'vitest';

import {
  assertQualityDecision,
  buildQualityInspectionRequest,
  buildProductLotQualitySampleDispositionRequest,
  buildProductLotQualitySampleInspectionRequest,
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

  it('construye inspecciÃ³n de muestra sin aceptar del formulario la cantidad apartada', () => {
    const data = new FormData();
    data.set('quality_sample_id', 'sample-1');
    data.set('sampled_quantity', '999');
    data.set('notes', 'Prueba de integridad');
    data.set('criterion_1', 'Integridad');
    data.set('expected_1', 'Sin roturas');
    data.set('actual_1', 'Ãntegras');
    data.set('passed_1', 'on');

    expect(buildProductLotQualitySampleInspectionRequest(data)).toEqual({
      sampleId: 'sample-1',
      notes: 'Prueba de integridad',
      criteria: [{
        criterion: 'Integridad',
        expectedValue: 'Sin roturas',
        actualValue: 'Ãntegras',
        passed: true,
      }],
      defects: [],
    });
  });

  it('construye la disposiciÃ³n por cantidad y exige autorizaciÃ³n explÃ­cita para devolver', () => {
    const data = new FormData();
    data.set('quality_inspection_id', 'inspection-1');
    data.set('quality_sample_id', 'sample-1');
    data.set('quantity', '1');
    data.set('destination', 'returned_to_lot');
    data.set('return_authorized', 'on');
    data.set('reason', 'Calidad verificÃ³ que siguiÃ³ intacta');
    data.set('idempotency_key', 'fd000000-0000-4000-8000-000000000301');

    expect(buildProductLotQualitySampleDispositionRequest(data)).toEqual({
      qualityInspectionId: 'inspection-1',
      sampleId: 'sample-1',
      quantity: 1,
      destination: 'returned_to_lot',
      returnAuthorized: true,
      reason: 'Calidad verificÃ³ que siguiÃ³ intacta',
      idempotencyKey: 'fd000000-0000-4000-8000-000000000301',
    });
  });

  it('rechaza retorno sin autorizaciÃ³n, cantidades invÃ¡lidas y destinos desconocidos', () => {
    const data = new FormData();
    data.set('quality_inspection_id', 'inspection-1');
    data.set('quality_sample_id', 'sample-1');
    data.set('quantity', '2');
    data.set('destination', 'returned_to_lot');
    data.set('reason', 'Intento sin aprobaciÃ³n');
    data.set('idempotency_key', 'fd000000-0000-4000-8000-000000000302');

    expect(() => buildProductLotQualitySampleDispositionRequest(data)).toThrow(
      'retorno de la muestra',
    );

    data.set('return_authorized', 'on');
    data.set('quantity', '1.5');
    expect(() => buildProductLotQualitySampleDispositionRequest(data)).toThrow(
      'entero positivo',
    );
    data.set('quantity', '2');
    data.set('destination', 'discard');
    expect(() => buildProductLotQualitySampleDispositionRequest(data)).toThrow(
      'destino de la muestra',
    );
  });

  it('registra merma directa sin requerir autorizaciÃ³n de retorno', () => {
    const data = new FormData();
    data.set('quality_inspection_id', 'inspection-1');
    data.set('quality_sample_id', 'sample-1');
    data.set('quantity', '2');
    data.set('destination', 'direct_waste');
    data.set('reason', 'Muestra consumida en prueba destructiva');
    data.set('idempotency_key', 'fd000000-0000-4000-8000-000000000303');

    expect(buildProductLotQualitySampleDispositionRequest(data)).toMatchObject({
      quantity: 2,
      destination: 'direct_waste',
      returnAuthorized: false,
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
