const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProductionOutputCompletionInput = {
  productionOrderId: unknown;
  producedQuantity: unknown;
  wasteQuantity: unknown;
  varianceReason: unknown;
  idempotencyKey: unknown;
};

export type ProductionOutputCompletionRequest =
  Readonly<{
    productionOrderId: string;
    producedQuantity: number;
    wasteQuantity: number;
    varianceReason: string | null;
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

function positiveInteger(
  value: unknown,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      'La cantidad producida debe ser un entero positivo.',
    );
  }

  return value;
}

function nonNegativeInteger(
  value: unknown,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      'La cantidad de merma debe ser un entero no negativo.',
    );
  }

  return value;
}

function normalizeVarianceReason(
  value: unknown,
  wasteQuantity: number,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    if (wasteQuantity > 0) {
      throw new Error(
        'El motivo de la variación es obligatorio cuando existe merma.',
      );
    }

    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(
      'El motivo de la variación no es válido.',
    );
  }

  const normalized = value.trim();

  if (
    normalized.length === 0 &&
    wasteQuantity > 0
  ) {
    throw new Error(
      'El motivo de la variación es obligatorio cuando existe merma.',
    );
  }

  if (normalized.length > 500) {
    throw new Error(
      'El motivo de la variación no puede exceder 500 caracteres.',
    );
  }

  return normalized || null;
}

export function buildProductionOutputCompletionRequest(
  input: ProductionOutputCompletionInput,
): ProductionOutputCompletionRequest {
  const productionOrderId = requiredUuid(
    input.productionOrderId,
    'La orden de producción no es válida.',
  );

  const producedQuantity = positiveInteger(
    input.producedQuantity,
  );

  const wasteQuantity = nonNegativeInteger(
    input.wasteQuantity,
  );

  const varianceReason =
    normalizeVarianceReason(
      input.varianceReason,
      wasteQuantity,
    );

  const idempotencyKey = requiredUuid(
    input.idempotencyKey,
    'La clave de idempotencia no es válida.',
  );

  return Object.freeze({
    productionOrderId,
    producedQuantity,
    wasteQuantity,
    varianceReason,
    idempotencyKey,
  });
}