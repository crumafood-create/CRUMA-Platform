const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LOT_NUMBER_PATTERN =
  /^[A-Z0-9][A-Z0-9._/-]{0,79}$/;

export type ProductionMaterialConsumptionInput = {
  productionOrderItemId: unknown;
  scannedLotNumber: unknown;
  idempotencyKey: unknown;
};

export type ProductionMaterialConsumptionRequest =
  Readonly<{
    productionOrderItemId: string;
    scannedLotNumber: string;
    idempotencyKey: string;
  }>;

function requiredUuid(
  value: unknown,
  message: string,
): string {
  if (typeof value !== 'string') {
    throw new Error(message);
  }

  const normalized = value
    .trim()
    .toLowerCase();

  if (!UUID_PATTERN.test(normalized)) {
    throw new Error(message);
  }

  return normalized;
}

function normalizedLotNumber(
  value: unknown,
): string {
  if (typeof value !== 'string') {
    throw new Error(
      'El lote escaneado no es válido.',
    );
  }

  const normalized = value
    .trim()
    .toUpperCase();

  if (!LOT_NUMBER_PATTERN.test(normalized)) {
    throw new Error(
      'El lote escaneado no es válido.',
    );
  }

  return normalized;
}

export function buildProductionMaterialConsumptionRequest(
  input: ProductionMaterialConsumptionInput,
): ProductionMaterialConsumptionRequest {
  const productionOrderItemId = requiredUuid(
    input.productionOrderItemId,
    'El artículo de producción no es válido.',
  );

  const scannedLotNumber = normalizedLotNumber(
    input.scannedLotNumber,
  );

  const idempotencyKey = requiredUuid(
    input.idempotencyKey,
    'La clave de idempotencia no es válida.',
  );

  return Object.freeze({
    productionOrderItemId,
    scannedLotNumber,
    idempotencyKey,
  });
}