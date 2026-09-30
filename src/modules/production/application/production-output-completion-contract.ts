const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProductionOutputCompletionInput = {
  productionOrderId: unknown;
  producedQuantity: unknown;
  idempotencyKey: unknown;
};

export type ProductionOutputCompletionRequest =
  Readonly<{
    productionOrderId: string;
    producedQuantity: number;
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

  const idempotencyKey = requiredUuid(
    input.idempotencyKey,
    'La clave de idempotencia no es válida.',
  );

  return Object.freeze({
    productionOrderId,
    producedQuantity,
    idempotencyKey,
  });
}