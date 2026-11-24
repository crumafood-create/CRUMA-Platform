import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import type {
  QualityDecision,
  QualityInspectionRequest,
  ProductLotQualitySampleInspectionRequest,
  ProductLotQualitySampleDispositionRequest,
  RawMaterialQualityInspectionRequest,
} from './quality-control-contract';

export async function recordProductLotQualitySampleInspection(
  supabase: TypedSupabaseClient,
  request: ProductLotQualitySampleInspectionRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'record_product_lot_quality_sample_inspection',
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
      p_notes: request.notes ?? '',
      p_sample_id: request.sampleId,
    },
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La inspección de muestra no devolvió un identificador.');
  return data;
}

export async function decideProductLotQualitySampleDisposition(
  supabase: TypedSupabaseClient,
  request: ProductLotQualitySampleDispositionRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'decide_product_lot_quality_sample_disposition',
    {
      p_sample_id: request.sampleId,
      p_quality_inspection_id: request.qualityInspectionId,
      p_quantity: request.quantity,
      p_destination: request.destination,
      p_return_authorized: request.returnAuthorized,
      p_reason: request.reason,
      p_idempotency_key: request.idempotencyKey,
    },
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La disposición no devolvió un identificador.');
  return data;
}

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

export async function recordPreparedIngredientQualityInspection(
  supabase: TypedSupabaseClient,
  request: RawMaterialQualityInspectionRequest,
): Promise<string> {
  const client = supabase as unknown as {
    rpc: (name: 'record_prepared_ingredient_quality_inspection', args: {
      p_lot_id: string;
      p_sampled_quantity: number;
      p_notes: string;
      p_criteria: Array<{ criterion: string; expected_value: string | null; actual_value: string | null; passed: boolean }>;
      p_defects: Array<{ defect_type: string; severity: string; quantity: number; description: string | null }>;
    }) => Promise<{ data: string | null; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc('record_prepared_ingredient_quality_inspection', {
    p_lot_id: request.rawMaterialLotId,
    p_sampled_quantity: request.sampledQuantity,
    p_notes: request.notes ?? '',
    p_criteria: request.criteria.map((item) => ({
      criterion: item.criterion,
      expected_value: item.expectedValue,
      actual_value: item.actualValue,
      passed: item.passed,
    })),
    p_defects: request.defects.map((item) => ({
      defect_type: item.defectType,
      severity: item.severity,
      quantity: item.quantity,
      description: item.description,
    })),
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La inspección de preparación no devolvió un identificador.');
  return data;
}

export async function releasePreparedIngredientQualityLot(
  supabase: TypedSupabaseClient,
  request: { inspectionId: string; storageCondition: 'dry' | 'refrigerated'; locationId: string; expirationDate: string; reason: string | null },
): Promise<string> {
  const client = supabase as unknown as {
    rpc: (name: 'release_prepared_ingredient_quality_lot', args: {
      p_inspection_id: string;
      p_storage_condition: string;
      p_inventory_location_id: string;
      p_expiration_date: string;
      p_reason: string;
    }) => Promise<{ data: string | null; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc('release_prepared_ingredient_quality_lot', {
    p_inspection_id: request.inspectionId,
    p_storage_condition: request.storageCondition,
    p_inventory_location_id: request.locationId,
    p_expiration_date: request.expirationDate,
    p_reason: request.reason ?? '',
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La liberación de preparación no devolvió un identificador.');
  return data;
}

export async function retainPreparedIngredientForStorageCorrection(
  supabase: TypedSupabaseClient,
  request: { inspectionId: string; reason: string },
): Promise<string> {
  const client = supabase as unknown as {
    rpc: (name: 'retain_prepared_ingredient_for_storage_correction', args: {
      p_inspection_id: string;
      p_reason: string;
    }) => Promise<{ data: string | null; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc(
    'retain_prepared_ingredient_for_storage_correction',
    { p_inspection_id: request.inspectionId, p_reason: request.reason },
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La retención para corregir el almacenamiento no devolvió un movimiento.');
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
