import type { CheeseCutRequest, CheeseGratingRequest, HamGratingRequest } from './cheese-preparation-contract';
import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

export async function recordCheeseCut(
  supabase: TypedSupabaseClient,
  request: CheeseCutRequest,
): Promise<string> {
  const client = supabase as unknown as {
    rpc: (name: 'record_cheese_cut', args: {
      p_source_lot_id: string;
      p_stick_presentation: string;
      p_stick_material_id: string;
      p_trim_material_id: string;
      p_source_quantity_kg: number;
      p_piece_count: number;
      p_stick_weight_kg: number;
      p_trim_weight_kg: number;
      p_waste_weight_kg: number;
      p_idempotency_key: string;
      p_reason: string;
    }) => Promise<{ data: string | null; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc('record_cheese_cut', {
    p_source_lot_id: request.sourceLotId,
    p_stick_presentation: request.presentation,
    p_stick_material_id: request.stickMaterialId,
    p_trim_material_id: request.trimMaterialId,
    p_source_quantity_kg: request.sourceQuantityKg,
    p_piece_count: request.pieceCount,
    p_stick_weight_kg: request.stickWeightKg,
    p_trim_weight_kg: request.trimWeightKg,
    p_waste_weight_kg: request.wasteWeightKg,
    p_idempotency_key: request.idempotencyKey,
    p_reason: request.reason,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('El corte no devolvió su identificador.');
  return data;
}

export async function recordCheeseGrating(
  supabase: TypedSupabaseClient,
  request: CheeseGratingRequest,
): Promise<string> {
  const client = supabase as unknown as {
    rpc: (name: 'record_cheese_grating', args: {
      p_trim_lot_id: string;
      p_grated_material_id: string;
      p_source_quantity_kg: number;
      p_grated_weight_kg: number;
      p_waste_weight_kg: number;
      p_idempotency_key: string;
      p_reason: string;
    }) => Promise<{ data: string | null; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc('record_cheese_grating', {
    p_trim_lot_id: request.trimLotId,
    p_grated_material_id: request.gratedMaterialId,
    p_source_quantity_kg: request.sourceQuantityKg,
    p_grated_weight_kg: request.gratedWeightKg,
    p_waste_weight_kg: request.wasteWeightKg,
    p_idempotency_key: request.idempotencyKey,
    p_reason: request.reason,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('El rallado no devolvió su identificador.');
  return data;
}

export async function recordHamGrating(
  supabase: TypedSupabaseClient,
  request: HamGratingRequest,
): Promise<string> {
  const client = supabase as unknown as {
    rpc: (name: 'record_ham_grating', args: {
      p_source_lot_id: string;
      p_grated_material_id: string;
      p_source_quantity_kg: number;
      p_grated_weight_kg: number;
      p_waste_weight_kg: number;
      p_idempotency_key: string;
      p_reason: string;
    }) => Promise<{ data: string | null; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc('record_ham_grating', {
    p_source_lot_id: request.sourceLotId,
    p_grated_material_id: request.gratedMaterialId,
    p_source_quantity_kg: request.sourceQuantityKg,
    p_grated_weight_kg: request.gratedWeightKg,
    p_waste_weight_kg: request.wasteWeightKg,
    p_idempotency_key: request.idempotencyKey,
    p_reason: request.reason,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('El rallado de jamón no devolvió su identificador.');
  return data;
}
