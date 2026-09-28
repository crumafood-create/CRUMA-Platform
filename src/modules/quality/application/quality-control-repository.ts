import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import type {
  QualityDecision,
  QualityInspectionRequest,
  RawMaterialQualityInspectionRequest,
} from './quality-control-contract';

export async function recordQualityInspection(
  supabase: TypedSupabaseClient,
  request: QualityInspectionRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc('record_quality_inspection', {
    p_criteria: request.criteria.map((item) => ({
      criterion: item.criterion,
      expected_value: item.expectedValue,
      actual_value: item.actualValue,
      passed: item.passed,
    })),
    p_defects: request.defects.map((defect) => ({
      defect_type: defect.defectType,
      severity: defect.severity,
      quantity: defect.quantity,
      description: defect.description,
    })),
    p_notes: request.notes ?? '',
    p_output_id: request.productionOutputId,
    p_sampled_quantity: request.sampledQuantity,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La inspección no devolvió un identificador.');
  return data;
}

export async function decideQualityRelease(
  supabase: TypedSupabaseClient,
  inspectionId: string,
  decision: QualityDecision,
  reason: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc('decide_quality_release', {
    p_decision: decision,
    p_inspection_id: inspectionId,
    p_reason: reason ?? '',
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La decisión no devolvió un identificador.');
  return data;
}
export async function recordRawMaterialQualityInspection(
  supabase: TypedSupabaseClient,
  request: RawMaterialQualityInspectionRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'record_raw_material_quality_inspection',
    {
      p_criteria: request.criteria.map((item) => ({
        criterion: item.criterion,
        expected_value: item.expectedValue,
        actual_value: item.actualValue,
        passed: item.passed,
      })),
      p_defects: request.defects.map((defect) => ({
        defect_type: defect.defectType,
        severity: defect.severity,
        quantity: defect.quantity,
        description: defect.description,
      })),
      p_lot_id: request.rawMaterialLotId,
      p_notes: request.notes ?? '',
      p_sampled_quantity:
        request.sampledQuantity,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'La inspección de materia prima no devolvió un identificador.',
    );
  }

  return data;
}

export async function decideRawMaterialQualityRelease(
  supabase: TypedSupabaseClient,
  inspectionId: string,
  decision: QualityDecision,
  reason: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'decide_raw_material_quality_release',
    {
      p_decision: decision,
      p_inspection_id: inspectionId,
      p_reason: reason ?? '',
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'La disposición del lote no devolvió un identificador.',
    );
  }

  return data;
}