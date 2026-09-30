import { describe, expect, it } from 'vitest';

import {
  buildFinishedProductQualityReleaseRequest,
} from './finished-product-quality-release-contract';

const UUIDS = {
  inspection:
    'a1000000-0000-4000-8000-000000000001',
  warehouse:
    'a2000000-0000-4000-8000-000000000001',
  location:
    'a3000000-0000-4000-8000-000000000001',
  idempotency:
    'a4000000-0000-4000-8000-000000000001',
} as const;

type FieldValue = string | null;

function validForm(
  overrides: Record<string, FieldValue> = {},
): FormData {
  const values: Record<string, FieldValue> = {
    quality_inspection_id: UUIDS.inspection,
    lot_number: '  pt-2026/001  ',
    expiration_date: '2099-12-31',
    warehouse_id: UUIDS.warehouse,
    inventory_location_id: UUIDS.location,
    idempotency_key: UUIDS.idempotency,
    reason: '  Cumple especificación  ',
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
  'contrato de liberación de producto terminado',
  () => {
    it(
      'normaliza una liberación idempotente',
      () => {
        expect(
          buildFinishedProductQualityReleaseRequest(
            validForm(),
          ),
        ).toEqual({
          qualityInspectionId: UUIDS.inspection,
          lotNumber: 'PT-2026/001',
          expirationDate: '2099-12-31',
          warehouseId: UUIDS.warehouse,
          inventoryLocationId: UUIDS.location,
          idempotencyKey: UUIDS.idempotency,
          reason: 'Cumple especificación',
        });
      },
    );

    it(
      'normaliza una razón vacía como null',
      () => {
        expect(
          buildFinishedProductQualityReleaseRequest(
            validForm({
              reason: '   ',
            }),
          ).reason,
        ).toBeNull();
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
          buildFinishedProductQualityReleaseRequest(
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
      'LOTE INVÁLIDO',
      null,
    ])(
      'rechaza un lote inválido: %s',
      (lotNumber) => {
        expect(() =>
          buildFinishedProductQualityReleaseRequest(
            validForm({
              lot_number: lotNumber,
            }),
          ),
        ).toThrow(
          'El número de lote no es válido.',
        );
      },
    );

    it.each([
      '',
      '2099-02-30',
      null,
    ])(
      'rechaza una fecha inválida: %s',
      (expirationDate) => {
        expect(() =>
          buildFinishedProductQualityReleaseRequest(
            validForm({
              expiration_date: expirationDate,
            }),
          ),
        ).toThrow(
          'La fecha de caducidad no es válida.',
        );
      },
    );

    it.each([
      '',
      'warehouse-invalid',
      null,
    ])(
      'rechaza un almacén inválido: %s',
      (warehouseId) => {
        expect(() =>
          buildFinishedProductQualityReleaseRequest(
            validForm({
              warehouse_id: warehouseId,
            }),
          ),
        ).toThrow(
          'El almacén no es válido.',
        );
      },
    );

    it.each([
      '',
      'location-invalid',
      null,
    ])(
      'rechaza una ubicación inválida: %s',
      (inventoryLocationId) => {
        expect(() =>
          buildFinishedProductQualityReleaseRequest(
            validForm({
              inventory_location_id:
                inventoryLocationId,
            }),
          ),
        ).toThrow(
          'La ubicación de inventario no es válida.',
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
          buildFinishedProductQualityReleaseRequest(
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