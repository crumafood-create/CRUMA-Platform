import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import type {
  FEFOAllocation,
  InventoryMovementInput,
} from '../domain/types';

import {
  INVENTORY_MOVEMENT,
} from '../domain/constants';

// ============================================================================
// INVENTORY MOVEMENTS
// ============================================================================

export async function createInventoryMovement(
  supabase: TypedSupabaseClient,
  movement: InventoryMovementInput,
): Promise<void> {
  const { error } =
    await supabase
      .from('inventory_movements')
      .insert({
        item_type:
          movement.item_type,

        item_id:
          movement.item_id,

        movement_type:
          movement.movement_type,

        quantity:
          movement.quantity,

        reference_type:
          movement.reference_type,

        reference_id:
          movement.reference_id,

        notes:
          movement.notes ?? null,

        created_at:
          new Date().toISOString(),
      });

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// UPDATE RAW MATERIAL LOT
// ============================================================================

export async function consumeRawMaterialLot(
  supabase: TypedSupabaseClient,
  allocation: FEFOAllocation,
): Promise<void> {
  const { error } =
    await supabase
      .from('raw_material_lots')
      .update({
        quantity:
          allocation.remaining_quantity,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        allocation.lot_id,
      );

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// REGISTER CONSUMPTION
// ============================================================================

export async function registerConsumption(
  supabase: TypedSupabaseClient,
  productionOrderItemId: string,
  allocation: FEFOAllocation,
): Promise<void> {
  const { error } =
    await supabase
      .from(
        'production_order_consumptions',
      )
      .insert({
        production_order_item_id:
          productionOrderItemId,

        raw_material_lot_id:
          allocation.lot_id,

        quantity:
          allocation.quantity,

        created_at:
          new Date().toISOString(),
      });

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// COMPLETE ITEM
// ============================================================================

export async function completeProductionItem(
  supabase: TypedSupabaseClient,
  itemId: string,
  consumedQuantity: number,
): Promise<void> {
  const { error } =
    await supabase
      .from(
        'production_order_items',
      )
      .update({
        consumed_quantity:
          consumedQuantity,

        status:
          'completed',

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        itemId,
      );

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// REGISTER EXIT MOVEMENT
// ============================================================================

export async function registerMaterialExit(
  supabase: TypedSupabaseClient,
  rawMaterialId: string,
  productionOrderId: string,
  allocation: FEFOAllocation,
) {
  await createInventoryMovement(
    supabase,
    {
      item_type:
        'raw_material',

      item_id:
        rawMaterialId,

      movement_type:
        INVENTORY_MOVEMENT.EXIT,

      quantity:
        allocation.quantity,

      reference_type:
        'production_order',

      reference_id:
        productionOrderId,

      notes:
        `Consumo FEFO (${allocation.lot_number})`,
    },
  );
}
