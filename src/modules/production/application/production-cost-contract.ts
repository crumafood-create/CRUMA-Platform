const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProductionCostRequest =
  Readonly<{
    productionOrderId: string;
    laborCost: number;
    overheadCost: number;
    idempotencyKey: string;
  }>;

export type ProductionCostTotals =
  Readonly<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    unitCost: number;
  }>;

function round(
  value: number,
): number {
  return Number(
    value.toFixed(4),
  );
}

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

function cost(
  value: unknown,
): number {
  if (
    (
      typeof value !== 'string' &&
      typeof value !== 'number'
    ) ||
    (
      typeof value === 'string' &&
      value.trim() === ''
    )
  ) {
    throw new Error(
      'Los costos deben ser números finitos no negativos.',
    );
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      'Los costos deben ser números finitos no negativos.',
    );
  }

  return round(parsed);
}

export function buildProductionCostRequest(
  formData: FormData,
  productionOrderId: unknown,
): ProductionCostRequest {
  const normalizedProductionOrderId =
    requiredUuid(
      productionOrderId,
      'La orden de producción no es válida.',
    );

  const laborCost = cost(
    formData.get('labor_cost'),
  );

  const overheadCost = cost(
    formData.get('overhead_cost'),
  );

  const idempotencyKey = requiredUuid(
    formData.get('idempotency_key'),
    'La clave de idempotencia no es válida.',
  );

  return Object.freeze({
    productionOrderId:
      normalizedProductionOrderId,
    laborCost,
    overheadCost,
    idempotencyKey,
  });
}

export function calculateProductionCostTotals(
  material: number,
  labor: number,
  overhead: number,
  produced: number,
): ProductionCostTotals {
  const materialCost = cost(material);
  const laborCost = cost(labor);
  const overheadCost = cost(overhead);

  if (
    !Number.isFinite(produced) ||
    produced <= 0
  ) {
    throw new Error(
      'La cantidad producida debe ser positiva.',
    );
  }

  const totalCost = round(
    materialCost +
      laborCost +
      overheadCost,
  );

  return Object.freeze({
    materialCost,
    laborCost,
    overheadCost,
    totalCost,
    unitCost: round(
      totalCost / produced,
    ),
  });
}
