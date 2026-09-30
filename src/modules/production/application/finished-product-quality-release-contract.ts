export type FinishedProductQualityReleaseRequest = {
  qualityInspectionId: string;
  lotNumber: string;
  expirationDate: string;
  warehouseId: string;
  inventoryLocationId: string;
  idempotencyKey: string;
  reason: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LOT_NUMBER_PATTERN =
  /^[A-Z0-9][A-Z0-9._/-]{1,39}$/;

function value(
  formData: FormData,
  key: string,
): string {
  return formData
    .get(key)
    ?.toString()
    .trim() ?? '';
}

function uuid(
  formData: FormData,
  key: string,
  message: string,
): string {
  const candidate = value(formData, key);

  if (!UUID_PATTERN.test(candidate)) {
    throw new Error(message);
  }

  return candidate;
}

function lotNumber(
  formData: FormData,
): string {
  const candidate = value(
    formData,
    'lot_number',
  ).toUpperCase();

  if (!LOT_NUMBER_PATTERN.test(candidate)) {
    throw new Error(
      'El número de lote no es válido.',
    );
  }

  return candidate;
}

function expirationDate(
  formData: FormData,
): string {
  const candidate = value(
    formData,
    'expiration_date',
  );

  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    throw new Error(
      'La fecha de caducidad no es válida.',
    );
  }

  const parsed = new Date(
    `${candidate}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !==
      candidate
  ) {
    throw new Error(
      'La fecha de caducidad no es válida.',
    );
  }

  return candidate;
}

export function buildFinishedProductQualityReleaseRequest(
  formData: FormData,
): FinishedProductQualityReleaseRequest {
  const reason = value(formData, 'reason');

  return {
    qualityInspectionId: uuid(
      formData,
      'quality_inspection_id',
      'La inspección de calidad no es válida.',
    ),
    lotNumber: lotNumber(formData),
    expirationDate: expirationDate(formData),
    warehouseId: uuid(
      formData,
      'warehouse_id',
      'El almacén no es válido.',
    ),
    inventoryLocationId: uuid(
      formData,
      'inventory_location_id',
      'La ubicación de inventario no es válida.',
    ),
    idempotencyKey: uuid(
      formData,
      'idempotency_key',
      'La clave de idempotencia no es válida.',
    ),
    reason: reason || null,
  };
}