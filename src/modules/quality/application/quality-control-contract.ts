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

function defects(formData: FormData, sampled: number): QualityDefectInput[] {
  const defectType = value(formData, 'defect_type');
  if (!defectType) return [];
  const severityValue = value(formData, 'defect_severity');
  if (!QUALITY_SEVERITIES.includes(severityValue as QualitySeverity)) {
    throw new Error('La severidad del defecto no es válida.');
  }
  const quantity = positiveInteger(
    value(formData, 'defect_quantity'),
    'La cantidad defectuosa debe ser un entero positivo.',
  );
  if (quantity > sampled) {
    throw new Error('La cantidad defectuosa no puede superar la muestra.');
  }
  return [{
    defectType,
    severity: severityValue as QualitySeverity,
    quantity,
    description: optional(value(formData, 'defect_description')),
  }];
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

export function assertQualityDecision(value: string): QualityDecision {
  if (!QUALITY_DECISIONS.includes(value as QualityDecision)) {
    throw new Error('La decisión de calidad no es válida.');
  }
  return value as QualityDecision;
}
