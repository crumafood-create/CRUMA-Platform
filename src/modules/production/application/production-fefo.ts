import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  FEFOAllocation,
  RawMaterialLot,
} from '../domain/types';

/**
 * Obtiene los lotes disponibles ordenados por FEFO.
 */
export async function getAvailableLotsFEFO(
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

/**
 * Calcula cómo consumir los lotes usando FEFO.
 * No modifica la base de datos.
 */
export function allocateLotsFEFO(
  lots: RawMaterialLot[],
  requiredQuantity: number,
): FEFOAllocation[] {
  let remaining = requiredQuantity;

  const allocations: FEFOAllocation[] = [];

  for (const lot of lots) {
    if (remaining <= 0) {
      break;
    }

    const available = Number(lot.quantity);

    if (available <= 0) {
      continue;
    }

    const consumed = Math.min(
      available,
      remaining,
    );

    allocations.push({
      lot_id: lot.id,
      lot_number: lot.lot_number,
      quantity: consumed,
      remaining_quantity:
        available - consumed,
    });

    remaining -= consumed;
  }

  if (remaining > 0) {
    throw new Error(
      `Stock insuficiente. Faltan ${remaining} unidades.`,
    );
  }

  return allocations;
}

/**
 * Devuelve directamente la asignación FEFO.
 */
export async function buildFEFOAllocation(
  supabase: SupabaseClient,
  rawMaterialId: string,
  quantity: number,
): Promise<FEFOAllocation[]> {
  const lots =
    await getAvailableLotsFEFO(
      supabase,
      rawMaterialId,
    );

  return allocateLotsFEFO(
    lots,
    quantity,
  );
}
