import type { SupabaseClient } from '@supabase/supabase-js';

import { buildFEFOAllocation } from './production-fefo';

import {
  getAvailableLots,
  validateSuggestedLot,
} from './production-lot';

import {
  consumeRawMaterialLot,
  registerConsumption,
  registerMaterialExit,
  completeProductionItem,
} from './production-movements';

import {
  PRODUCTION_STATUS,
} from '../domain/constants';

// ============================================================================
// CONSUME MATERIAL
// ============================================================================

export async function consumeProductionItem(
  supabase: SupabaseClient,
  productionOrderItemId: string,
  scannedLotNumber: string,
): Promise<void> {
  //
  // Obtener item
  //
  const {
    data: item,
    error: itemError,
  } = await supabase
    .from('production_order_items')
    .select(`
      id,
      production_order_id,
      raw_material_id,
      planned_quantity,
      consumed_quantity,
      status
    `)
    .eq('id', productionOrderItemId)
    .single();

  if (itemError || !item) {
    throw new Error(
      itemError?.message ??
        'Item de producción no encontrado.',
    );
  }

  if (item.status === 'completed') {
    return;
  }

  //
  // Validar lote escaneado
  //
  await validateSuggestedLot(
    supabase,
    item.raw_material_id,
    scannedLotNumber,
  );

  //
  // Obtener todos los lotes FEFO
  //
  const lots =
    await getAvailableLots(
      supabase,
      item.raw_material_id,
    );

  //
  // Calcular asignación FEFO
  //
  const allocations =
    buildFEFOAllocation(
      lots,
      Number(item.planned_quantity),
    );

  //
  // Consumir lotes
  //
  for (const allocation of allocations) {
    await consumeRawMaterialLot(
      supabase,
      allocation,
    );

    await registerConsumption(
      supabase,
      item.id,
      allocation,
    );

    await registerMaterialExit(
      supabase,
      item.raw_material_id,
      item.production_order_id,
      allocation,
    );
  }

  //
  // Completar item
  //
  await completeProductionItem(
    supabase,
    item.id,
    Number(item.planned_quantity),
  );

  //
  // Actualizar orden
  //
  await updateProductionStatus(
    supabase,
    item.production_order_id,
  );
}

// ============================================================================
// UPDATE ORDER STATUS
// ============================================================================

export async function updateProductionStatus(
  supabase: SupabaseClient,
  productionOrderId: string,
): Promise<void> {
  const {
    data: items,
    error,
  } = await supabase
    .from('production_order_items')
    .select(`
      id,
      status
    `)
    .eq(
      'production_order_id',
      productionOrderId,
    );

  if (error) {
    throw new Error(error.message);
  }

  const completed =
    (items ?? []).every(
      (item) =>
        item.status ===
        'completed',
    );

  await supabase
    .from('production_orders')
    .update({
      status: completed
        ? PRODUCTION_STATUS.COMPLETED
        : PRODUCTION_STATUS.IN_PROGRESS,

      completed_at: completed
        ? new Date().toISOString()
        : null,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      productionOrderId,
    );
}

// ============================================================================
// GET NEXT ITEM
// ============================================================================

export async function getNextProductionItem(
  supabase: SupabaseClient,
  productionOrderId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from('production_order_items')
    .select(`
      id,
      raw_material_id,
      planned_quantity,
      consumed_quantity,
      status
    `)
    .eq(
      'production_order_id',
      productionOrderId,
    )
    .neq(
      'status',
      'completed',
    )
    .order(
      'created_at',
      {
        ascending: true,
      },
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
