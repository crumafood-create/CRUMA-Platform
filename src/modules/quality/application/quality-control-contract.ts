export const QUALITY_DECISIONS = ['release', 'hold', 'reject'] as const;
export const QUALITY_SEVERITIES = ['minor', 'major', 'critical'] as const;

export type QualityDecision = (typeof QUALITY_DECISIONS)[number];
export type QualitySeverity = (typeof QUALITY_SEVERITIES)[number];

export type QualityCriterionInput = {
  criterion: string;
  expectedValue: string | null;
  actualValue: string | null;
  passed: boolean;
};

export type QualityDefectInput = {
  defectType: string;
  severity: QualitySeverity;
  quantity: number;
  description: string | null;
};

export type QualityInspectionRequest = {
  productionOutputId: string;
  sampledQuantity: number;
  notes: string | null;
  criteria: QualityCriterionInput[];
  defects: QualityDefectInput[];
};

export type RawMaterialQualityInspectionRequest = {
  rawMaterialLotId: string;
  sampledQuantity: number;
  notes: string | null;
  criteria: QualityCriterionInput[];
  defects: QualityDefectInput[];
};

export type ProductLotQualitySampleInspectionRequest = {
  sampleId: string;
  notes: string | null;
  criteria: QualityCriterionInput[];
  defects: QualityDefectInput[];
};

export const PRODUCT_LOT_QUALITY_SAMPLE_DESTINATIONS = [
  'returned_to_lot',
  'direct_waste',
] as const;

export type ProductLotQualitySampleDispositionDestination =
  (typeof PRODUCT_LOT_QUALITY_SAMPLE_DESTINATIONS)[number];

export type ProductLotQualitySampleDispositionRequest = {
  qualityInspectionId: string;
  sampleId: string;
  quantity: number;
  destination: ProductLotQualitySampleDispositionDestination;
  returnAuthorized: boolean;
  reason: string;
  idempotencyKey: string;
};

export type UnderThresholdFrozenLotQualityDecisionRequest = {
  productLotId: string;
  inspectedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  destructiveQuantity: number;
  processVerified: boolean;
  conservationVerified: boolean;
  conservationEvidence: string;
  witnessSampleExceptionReason: string;
  reason: string;
  idempotencyKey: string;
};

function value(formData: FormData, key: string): string {
  return formData.get(key)?.toString().trim() ?? '';
}

function optional(input: string): string | null {
  return input || null;
}

function positiveInteger(input: string, message: string): number {
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(message);
  return parsed;
}

function positiveFiniteQuantity(
  input: string,
  message: string,
): number {
  const parsed = Number(input);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    throw new Error(message);
  }

  return parsed;
}

function criteria(formData: FormData): QualityCriterionInput[] {
  return [1, 2, 3].flatMap((index) => {
    const criterion = value(formData, `criterion_${index}`);
    if (!criterion) return [];
    return [{
      criterion,
      expectedValue: optional(value(formData, `expected_${index}`)),
      actualValue: optional(value(formData, `actual_${index}`)),
      passed: formData.get(`passed_${index}`) === 'on',
    }];
  });
}

function defects(
  formData: FormData,
  sampled?: number,
  allowDecimal = false,
): QualityDefectInput[] {
  const defectType = value(formData, 'defect_type');
  if (!defectType) return [];
  const severityValue = value(formData, 'defect_severity');
  if (!QUALITY_SEVERITIES.includes(severityValue as QualitySeverity)) {
    throw new Error('La severidad del defecto no es válida.');
  }
 const quantity = allowDecimal
  ? positiveFiniteQuantity(
      value(formData, 'defect_quantity'),
      'La cantidad defectuosa debe ser positiva y finita.',
    )
  : positiveInteger(
      value(formData, 'defect_quantity'),
      'La cantidad defectuosa debe ser un entero positivo.',
    );

  if (sampled !== undefined && quantity > sampled) {
    throw new Error('La cantidad defectuosa no puede superar la muestra.');
  }
  return [{
    defectType,
    severity: severityValue as QualitySeverity,
    quantity,
    description: optional(value(formData, 'defect_description')),
  }];
}

export function buildProductLotQualitySampleInspectionRequest(
  formData: FormData,
): ProductLotQualitySampleInspectionRequest {
  const sampleId = value(formData, 'quality_sample_id');
  if (!sampleId) {
    throw new Error('La muestra de Calidad es obligatoria.');
  }
  const inspectionCriteria = criteria(formData);
  if (inspectionCriteria.length === 0) {
    throw new Error('La inspeccion requiere al menos un criterio.');
  }
  return {
    sampleId,
    notes: optional(value(formData, 'notes')),
    criteria: inspectionCriteria,
    // The database validates defect quantity against the reserved sample.
    defects: defects(formData),
  };
}

export function buildProductLotQualitySampleDispositionRequest(
  formData: FormData,
): ProductLotQualitySampleDispositionRequest {
  const qualityInspectionId = value(formData, 'quality_inspection_id');
  const sampleId = value(formData, 'quality_sample_id');
  if (!qualityInspectionId || !sampleId) {
    throw new Error('La inspección y la muestra de Calidad son obligatorias.');
  }

  const quantity = positiveInteger(
    value(formData, 'quantity'),
    'La cantidad de disposición debe ser un entero positivo.',
  );
  const destination = value(formData, 'destination');
  if (!PRODUCT_LOT_QUALITY_SAMPLE_DESTINATIONS.includes(
    destination as ProductLotQualitySampleDispositionDestination,
  )) {
    throw new Error('El destino de la muestra no es válido.');
  }

  const returnAuthorized = formData.get('return_authorized') === 'on';
  if (destination === 'returned_to_lot' && !returnAuthorized) {
    throw new Error('Calidad debe autorizar explícitamente el retorno de la muestra.');
  }
  if (destination === 'direct_waste' && returnAuthorized) {
    throw new Error('La merma directa no puede incluir autorización de retorno.');
  }

  const reason = value(formData, 'reason');
  if (!reason) {
    throw new Error('El motivo de disposición es obligatorio.');
  }

  const idempotencyKey = value(formData, 'idempotency_key');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    throw new Error('La clave de reintento de disposición no es válida.');
  }

  return {
    qualityInspectionId,
    sampleId,
    quantity,
    destination: destination as ProductLotQualitySampleDispositionDestination,
    returnAuthorized,
    reason,
    idempotencyKey,
  };
}

export function buildUnderThresholdFrozenLotQualityDecisionRequest(
  formData: FormData,
): UnderThresholdFrozenLotQualityDecisionRequest {
  const productLotId = value(formData, 'product_lot_id');
  const idempotencyKey = value(formData, 'idempotency_key');
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(productLotId) || !uuidPattern.test(idempotencyKey)) {
    throw new Error('El lote y la clave de decisión no son válidos.');
  }
  const inspectedQuantity = positiveInteger(value(formData, 'inspected_quantity'), 'La cantidad inspeccionada debe ser entera.');
  const acceptedQuantity = Number(value(formData, 'accepted_quantity'));
  const rejectedQuantity = Number(value(formData, 'rejected_quantity'));
  const destructiveQuantity = Number(value(formData, 'destructive_quantity'));
  if (![acceptedQuantity, rejectedQuantity, destructiveQuantity].every((quantity) => Number.isInteger(quantity) && quantity >= 0)
    || acceptedQuantity + rejectedQuantity + destructiveQuantity !== inspectedQuantity) {
    throw new Error('Aceptadas, rechazadas y pruebas destructivas deben sumar la cantidad inspeccionada.');
  }
  const processVerified = formData.get('process_verified') === 'on';
  const conservationVerified = formData.get('conservation_verified') === 'on';
  const conservationEvidence = value(formData, 'conservation_evidence');
  if (!conservationEvidence) {
    throw new Error('Registra la evidencia de conservación revisada; la ausencia de registros no confirma conservación.');
  }
  const hasPositiveConservationRecord = /^folio=\S+;\s*fecha\/hora=[^;]+;\s*lectura=[^;]+;\s*especificacion=[^;]+$/i.test(conservationEvidence);
  if (acceptedQuantity > 0 && (!processVerified || !conservationVerified || !hasPositiveConservationRecord)) {
    throw new Error('Para liberar piezas, verifica el proceso y la conservación.');
  }
  if (formData.get('witness_sample_exception') !== 'on') {
    throw new Error('Calidad debe autorizar explícitamente la excepción de muestra testigo.');
  }
  const witnessSampleExceptionReason = value(formData, 'witness_sample_exception_reason');
  const reason = value(formData, 'reason');
  if (!witnessSampleExceptionReason || !reason || witnessSampleExceptionReason.length > 500 || reason.length > 500) {
    throw new Error('Registra el motivo de la excepción y la decisión de Calidad.');
  }
  return {
    productLotId,
    inspectedQuantity,
    acceptedQuantity,
    rejectedQuantity,
    destructiveQuantity,
    processVerified,
    conservationVerified,
    conservationEvidence,
    witnessSampleExceptionReason,
    reason,
    idempotencyKey,
  };
}

export function buildQualityInspectionRequest(
  formData: FormData,
): QualityInspectionRequest {
  const productionOutputId = value(formData, 'production_output_id');
  if (!productionOutputId) throw new Error('La salida de producción es obligatoria.');
  const sampledQuantity = positiveInteger(
    value(formData, 'sampled_quantity'),
    'La cantidad muestreada debe ser un entero positivo.',
  );
  const inspectionCriteria = criteria(formData);
  if (inspectionCriteria.length === 0) {
    throw new Error('La inspección requiere al menos un criterio.');
  }
  return {
    productionOutputId,
    sampledQuantity,
    notes: optional(value(formData, 'notes')),
    criteria: inspectionCriteria,
    defects: defects(formData, sampledQuantity),
  };
}

export function buildRawMaterialQualityInspectionRequest(
  formData: FormData,
): RawMaterialQualityInspectionRequest {
  const rawMaterialLotId = value(
    formData,
    'raw_material_lot_id',
  );

  if (!rawMaterialLotId) {
    throw new Error(
      'El lote de materia prima es obligatorio.',
    );
  }

  const sampledQuantity = positiveFiniteQuantity(
    value(formData, 'sampled_quantity'),
    'La cantidad muestreada debe ser positiva y finita.',
  );

  const inspectionCriteria = criteria(formData);

  if (inspectionCriteria.length === 0) {
    throw new Error(
      'La inspección requiere al menos un criterio.',
    );
  }

  return {
    rawMaterialLotId,
    sampledQuantity,
    notes: optional(value(formData, 'notes')),
    criteria: inspectionCriteria,
    defects: defects(
      formData,
      sampledQuantity,
      true,
    ),
  };
}

export function assertQualityDecision(value: string): QualityDecision {
  if (!QUALITY_DECISIONS.includes(value as QualityDecision)) {
    throw new Error('La decisión de calidad no es válida.');
  }
  return value as QualityDecision;
}
