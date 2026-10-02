const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProductionOrderCreationInput = {
  recipeId: unknown;
  plannedQuantity: unknown;
  notes: unknown;
  idempotencyKey: unknown;
};

export type ProductionOrderCreationRequest =
  Readonly<{
    recipeId: string;
    plannedQuantity: number;
    notes: string | null;
    idempotencyKey: string;
  }>;

export type ProductionOrderTransition =
  | 'release'
  | 'start'
  | 'cancel';

export type ProductionOrderTransitionInput = {
  productionOrderId: unknown;
  transition: unknown;
  reason: unknown;
  idempotencyKey: unknown;
};

export type ProductionOrderTransitionRequest =
  Readonly<{
    productionOrderId: string;
    transition: ProductionOrderTransition;
    reason: string | null;
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
      'La cantidad planeada debe ser un entero positivo.',
    );
  }

  return value;
}

function normalizeNotes(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(
      'Las notas no son válidas.',
    );
  }

  const normalized = value.trim();

  if (normalized.length > 500) {
    throw new Error(
      'Las notas no pueden exceder 500 caracteres.',
    );
  }

  return normalized || null;
}

function normalizeTransition(
  value: unknown,
): ProductionOrderTransition {
  if (typeof value !== 'string') {
    throw new Error(
      'La transición debe ser liberar, iniciar o cancelar.',
    );
  }

  const normalized = value
    .trim()
    .toLowerCase();

  if (
    normalized !== 'release' &&
    normalized !== 'start' &&
    normalized !== 'cancel'
  ) {
    throw new Error(
      'La transición debe ser liberar, iniciar o cancelar.',
    );
  }

  return normalized;
}

function normalizeReason(
  value: unknown,
  transition: ProductionOrderTransition,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    if (transition === 'cancel') {
      throw new Error(
        'El motivo de cancelación es obligatorio.',
      );
    }

    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(
      'El motivo de la transición no es válido.',
    );
  }

  const normalized = value.trim();

  if (
    normalized.length === 0 &&
    transition === 'cancel'
  ) {
    throw new Error(
      'El motivo de cancelación es obligatorio.',
    );
  }

  if (normalized.length > 500) {
    throw new Error(
      'El motivo de la transición no puede exceder 500 caracteres.',
    );
  }

  return normalized || null;
}

export function buildProductionOrderCreationRequest(
  input: ProductionOrderCreationInput,
): ProductionOrderCreationRequest {
  const recipeId = requiredUuid(
    input.recipeId,
    'La receta no es válida.',
  );

  const plannedQuantity = positiveInteger(
    input.plannedQuantity,
  );

  const notes = normalizeNotes(
    input.notes,
  );

  const idempotencyKey = requiredUuid(
    input.idempotencyKey,
    'La clave de idempotencia no es válida.',
  );

  return Object.freeze({
    recipeId,
    plannedQuantity,
    notes,
    idempotencyKey,
  });
}

export function buildProductionOrderTransitionRequest(
  input: ProductionOrderTransitionInput,
): ProductionOrderTransitionRequest {
  const productionOrderId = requiredUuid(
    input.productionOrderId,
    'La orden de producción no es válida.',
  );

  const transition = normalizeTransition(
    input.transition,
  );

  const reason = normalizeReason(
    input.reason,
    transition,
  );

  const idempotencyKey = requiredUuid(
    input.idempotencyKey,
    'La clave de idempotencia no es válida.',
  );

  return Object.freeze({
    productionOrderId,
    transition,
    reason,
    idempotencyKey,
  });
}
