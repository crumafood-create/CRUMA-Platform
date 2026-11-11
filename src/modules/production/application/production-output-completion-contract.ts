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

export type ProductionMassLotSurplusRequest =
  ProductionOutputCompletionRequest & Readonly<{
    lotSurpluses: readonly Readonly<{
      productLotId: string;
      surplusQuantity: number;
    }>[];
  }>;

export type ProductionMassLotSurplusInput =
  ProductionOutputCompletionInput & {
    lotSurpluses: unknown;
  };

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

function nonNegativeKg(value: unknown): number {
  const normalized =
    typeof value === 'number' ? String(value) :
      typeof value === 'string' ? value.trim() : '';

  if (!/^\d+(?:\.\d{1,4})?$/.test(normalized)) {
    throw new Error(
      'El sobrante debe ser una cantidad no negativa en kg con hasta cuatro decimales.',
    );
  }

  const quantity = Number(normalized);
  if (!Number.isFinite(quantity)) {
    throw new Error(
      'El sobrante debe ser una cantidad no negativa en kg con hasta cuatro decimales.',
    );
  }

  return quantity;
}

export function buildProductionMassLotSurplusRequest(
  input: ProductionMassLotSurplusInput,
): ProductionMassLotSurplusRequest {
  const completion = buildProductionOutputCompletionRequest(input);

  if (!Array.isArray(input.lotSurpluses) || input.lotSurpluses.length === 0) {
    throw new Error('Registra el sobrante de cada lote de masa.');
  }

  const lotSurpluses = input.lotSurpluses.map((value) => {
    if (!value || typeof value !== 'object') {
      throw new Error('La lista de sobrantes por lote no es válida.');
    }

    const item = value as Record<string, unknown>;
    return Object.freeze({
      productLotId: requiredUuid(
        item.productLotId,
        'Un lote de masa no es válido.',
      ),
      surplusQuantity: nonNegativeKg(item.surplusQuantity),
    });
  });

  if (new Set(lotSurpluses.map((item) => item.productLotId)).size !== lotSurpluses.length) {
    throw new Error('Registra cada lote de masa una sola vez.');
  }

  return Object.freeze({ ...completion, lotSurpluses });
}
