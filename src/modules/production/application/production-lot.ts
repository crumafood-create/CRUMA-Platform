import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  RawMaterialLot,
} from '../domain/types';

export type SuggestedRawMaterialLot = {
  id: string;
  lot_number: string;
  quantity: number;
  expiration_date: string | null;
  location_name: string;
};

// ============================================================================
// GET AVAILABLE LOTS (FEFO)
// ============================================================================

export async function getAvailableLots(
  supabase: SupabaseClient,
  rawMaterialId: string,
): Promise<RawMaterialLot[]> {
  const { data, error } = await supabase
    .from('raw_material_lots')
    .select(`
      id,
      raw_material_id,
      lot_number,
      quantity,
      expiration_date,
      created_at
    `)
    .eq('raw_material_id', rawMaterialId)
    .gt('quantity', 0)
    .order('expiration_date', {
      ascending: true,
      nullsFirst: false,
    })
    .order('created_at', {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((lot: any) => ({
    id: lot.id,
    raw_material_id: lot.raw_material_id,
    lot_number: lot.lot_number,
    quantity: Number(lot.quantity),
    expiration_date: lot.expiration_date,
    created_at: lot.created_at,
  }));
}

// ============================================================================
// GET SUGGESTED LOT
// ============================================================================

export async function getSuggestedRawMaterialLot(
  supabase: SupabaseClient,
  rawMaterialId: string,
): Promise<SuggestedRawMaterialLot | null> {
  const { data, error } = await supabase
    .from('raw_material_lots')
    .select(`
      id,
      lot_number,
      quantity,
      expiration_date,

      inventory_locations (
        name
      )
    `)
    .eq('raw_material_id', rawMaterialId)
    .gt('quantity', 0)
    .order('expiration_date', {
      ascending: true,
      nullsFirst: false,
    })
    .order('created_at', {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const location = Array.isArray(
    data.inventory_locations,
  )
    ? data.inventory_locations[0]
    : data.inventory_locations;

  return {
    id: data.id,
    lot_number: data.lot_number,
    quantity: Number(data.quantity),
    expiration_date: data.expiration_date,
    location_name:
      location?.name ?? 'Sin ubicación',
  };
}

// ============================================================================
// VALIDATE SCANNED LOT
// ============================================================================

export async function validateSuggestedLot(
  supabase: SupabaseClient,
  rawMaterialId: string,
  scannedLotNumber: string,
): Promise<SuggestedRawMaterialLot> {
  const suggested =
    await getSuggestedRawMaterialLot(
      supabase,
      rawMaterialId,
    );

  if (!suggested) {
    throw new Error(
      'No existe un lote disponible para esta materia prima.',
    );
  }

  const scanned =
    scannedLotNumber
      .trim()
      .toUpperCase();

  const expected =
    suggested.lot_number.toUpperCase();

  if (scanned !== expected) {
    throw new Error(
      `Lote incorrecto. Esperado: ${suggested.lot_number}. Escaneado: ${scannedLotNumber}`,
    );
  }

  return suggested;
}
