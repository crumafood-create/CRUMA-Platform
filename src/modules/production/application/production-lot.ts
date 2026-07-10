import type { SupabaseClient } from '@supabase/supabase-js';

export type SuggestedRawMaterialLot = {
  id: string;
  lot_number: string;
  quantity: number;
  expiration_date: string | null;
  location_name: string;
};

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

  const location = Array.isArray(data.inventory_locations)
    ? data.inventory_locations[0]
    : data.inventory_locations;

  return {
    id: data.id,
    lot_number: data.lot_number,
    quantity: Number(data.quantity),
    expiration_date: data.expiration_date,
    location_name: location?.name ?? 'Sin ubicación',
  };
}

export async function validateSuggestedLot(
  supabase: SupabaseClient,
  rawMaterialId: string,
  scannedLot: string,
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

  const normalized =
    scannedLot.trim().toUpperCase();

  if (
    suggested.lot_number.toUpperCase() !==
    normalized
  ) {
    throw new Error(
      `Lote incorrecto. Esperado: ${suggested.lot_number}. Escaneado: ${scannedLot}`,
    );
  }

  return suggested;
  }
