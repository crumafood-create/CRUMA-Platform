const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const
  FINISHED_PRODUCT_NONCONFORMANCE_DISPOSITIONS = [
    'scrap',
    'rework',
  ] as const;

export type FinishedProductNonconformanceDisposition =
  (typeof FINISHED_PRODUCT_NONCONFORMANCE_DISPOSITIONS)[number];

export type FinishedProductNonconformanceDispositionRequest =
  Readonly<{
    qualityInspectionId: string;
    disposition:
      FinishedProductNonconformanceDisposition;
    reason: string;
    idempotencyKey: string;
  }>;

function value(
  formData: FormData,
  key: string,
): string {
  return (
    formData
      .get(key)
      ?.toString()
      .trim() ?? ''
  );
}

function requiredUuid(
  input: string,
  message: string,
): string {
  const normalized = input.toLowerCase();

  if (!UUID_PATTERN.test(normalized)) {
    throw new Error(message);
  }

  return normalized;
}

export function buildFinishedProductNonconformanceDispositionRequest(
  formData: FormData,
): FinishedProductNonconformanceDispositionRequest {
  const qualityInspectionId = requiredUuid(
    value(
      formData,
      'quality_inspection_id',
    ),
    'La inspección de calidad no es válida.',
  );

  const dispositionValue = value(
    formData,
    'disposition',
  ).toLowerCase();

  if (
    !FINISHED_PRODUCT_NONCONFORMANCE_DISPOSITIONS.includes(
      dispositionValue as
        FinishedProductNonconformanceDisposition,
    )
  ) {
    throw new Error(
      'La disposición debe ser descarte o retrabajo.',
    );
  }

  const reason = value(formData, 'reason');

  if (!reason) {
    throw new Error(
      'El motivo de la disposición es obligatorio.',
    );
  }

  if (reason.length > 500) {
    throw new Error(
      'El motivo de la disposición no puede exceder 500 caracteres.',
    );
  }

  const idempotencyKey = requiredUuid(
    value(formData, 'idempotency_key'),
    'La clave de idempotencia no es válida.',
  );

  return Object.freeze({
    qualityInspectionId,
    disposition:
      dispositionValue as
        FinishedProductNonconformanceDisposition,
    reason,
    idempotencyKey,
  });
}
