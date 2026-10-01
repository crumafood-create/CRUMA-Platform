import { describe, expect, it } from 'vitest';

import {
  buildFinishedProductNonconformanceDispositionRequest,
} from './finished-product-nonconformance-disposition-contract';

const UUIDS = {
  inspection:
    'a1000000-0000-4000-8000-000000000001',
  idempotency:
    'a2000000-0000-4000-8000-000000000001',
} as const;

type FieldValue = string | null;

function validForm(
  overrides: Record<string, FieldValue> = {},
): FormData {
  const values: Record<string, FieldValue> = {
    quality_inspection_id: UUIDS.inspection,
    disposition: 'scrap',
    reason: '  Defecto crítico confirmado  ',
    idempotency_key: UUIDS.idempotency,
    ...overrides,
  };

  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    if (value !== null) {
      formData.set(key, value);
    }
  }

  return formData;
}

describe(
  'contrato de disposición de producto no conforme',
  () => {
    it.each([
      ['scrap', 'scrap'],
      [' rework ', 'rework'],
    ] as const)(
      'normaliza una disposición %s',
      (input, disposition) => {
        expect(
          buildFinishedProductNonconformanceDispositionRequest(
            validForm({
              disposition: input,
            }),
          ),
        ).toEqual({
          qualityInspectionId: UUIDS.inspection,
          disposition,
          reason: 'Defecto crítico confirmado',
          idempotencyKey: UUIDS.idempotency,
        });
      },
    );

    it.each([
      '',
      'inspection-invalid',
      null,
    ])(
      'rechaza una inspección inválida: %s',
      (qualityInspectionId) => {
        expect(() =>
          buildFinishedProductNonconformanceDispositionRequest(
            validForm({
              quality_inspection_id:
                qualityInspectionId,
            }),
          ),
        ).toThrow(
          'La inspección de calidad no es válida.',
        );
      },
    );

    it.each([
      '',
      'hold',
      'reject',
      null,
    ])(
      'rechaza una disposición inválida: %s',
      (disposition) => {
        expect(() =>
          buildFinishedProductNonconformanceDispositionRequest(
            validForm({
              disposition,
            }),
          ),
        ).toThrow(
          'La disposición debe ser descarte o retrabajo.',
        );
      },
    );

    it.each([
      '',
      '   ',
      null,
    ])(
      'exige un motivo: %s',
      (reason) => {
        expect(() =>
          buildFinishedProductNonconformanceDispositionRequest(
            validForm({
              reason,
            }),
          ),
        ).toThrow(
          'El motivo de la disposición es obligatorio.',
        );
      },
    );

    it(
      'rechaza un motivo excesivamente largo',
      () => {
        expect(() =>
          buildFinishedProductNonconformanceDispositionRequest(
            validForm({
              reason: 'x'.repeat(501),
            }),
          ),
        ).toThrow(
          'El motivo de la disposición no puede exceder 500 caracteres.',
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
          buildFinishedProductNonconformanceDispositionRequest(
            validForm({
              idempotency_key: idempotencyKey,
            }),
          ),
        ).toThrow(
          'La clave de idempotencia no es válida.',
        );
      },
    );
  },
);
