'use server';

import crypto from 'crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { getSuggestedRawMaterialLot } from '@/modules/production/application/production-lot';
import {
  canCancelProductionOrder,
  calculateRequiredQuantity,
  sumAvailableStock,
  toProductionOrderState,
  type ProductionOrderState,
} from '@/modules/production/application/production-order-contract';
import { consumeProductionItem } from '@/modules/production/application/production-service';
import {
  INVENTORY_MOVEMENT,
  INVENTORY_REFERENCE,
  PRODUCTION_STATUS,
} from '@/modules/production/domain/constants';

/**
 * Genera un número de orden único
 * Formato: OP-YYYYMMDD-XXXXXX
 */
function generateOrderNumber(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomUUID().slice(0, 6).toUpperCase();

  return `OP-${yyyy}${mm}${dd}-${random}`;
}

/**
 * Obtiene el estado actual de una orden de producción
 */
async function getProductionOrder(
  supabase: TypedSupabaseClient,
  orderId: string,
): Promise<ProductionOrderState> {
  const { data: order, error } = await supabase
    .from('production_orders')
    .select(`
      id,
      recipe_id,
      planned_quantity,
      produced_quantity,
      production_status,
      notes
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(error?.message ?? 'Orden de producción no encontrada');
  }

  return toProductionOrderState(order);
}

/**
 * Valida que hay suficiente stock para los ingredientes de una receta
 * usando raw_material_lots como fuente de verdad.
 */
async function validateRecipeStockAvailability(
  supabase: TypedSupabaseClient,
  recipeId: string,
  plannedQuantity: number,
) {
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id')
    .eq('id', recipeId)
    .single();

  if (recipeError || !recipe) {
    throw new Error(recipeError?.message ?? 'Receta no encontrada');
  }

  const { data: recipeItems, error: itemsError } = await supabase
    .from('recipe_items')
    .select('raw_material_id, quantity')
    .eq('recipe_id', recipeId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const items = recipeItems ?? [];

  if (items.length === 0) {
    return true;
  }

  for (const item of items) {
    const required = calculateRequiredQuantity(
      item.quantity,
      plannedQuantity,
    );

    const { data: lots, error: lotsError } = await supabase
      .from('raw_material_lots')
      .select('quantity')
      .eq('raw_material_id', item.raw_material_id)
      .gt('quantity', 0);

    if (lotsError) {
      throw new Error(
        `No se puede verificar stock para ingrediente ${item.raw_material_id}: ${lotsError.message}`,
      );
    }

    const available = sumAvailableStock(lots ?? []);

    if (available < required) {
      throw new Error(
        `Stock insuficiente para el ingrediente ${item.raw_material_id}. Disponible: ${available}, Requerido: ${required}`,
      );
    }
  }

  return true;
}

/**
 * Registra un movimiento de inventario
 */
async function createInventoryMovement(
  supabase: TypedSupabaseClient,
  movement: {
    item_type: 'product' | 'raw_material';
    item_id: string;
    movement_type: 'entry' | 'exit' | 'adjustment' | 'transfer';
    quantity: number;
    reference_type: string;
    reference_id: string;
    notes?: string;
  },
) {
  const { error } = await supabase.from('inventory_movements').insert({
    item_type: movement.item_type,
    item_id: movement.item_id,
    movement_type: movement.movement_type,
    quantity: movement.quantity,
    reference_type: movement.reference_type,
    reference_id: movement.reference_id,
    notes: movement.notes || null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(
      `Error al registrar movimiento de inventario: ${error.message}`,
    );
  }
}

/**
 * Revalida las rutas relacionadas con producción e inventario
 */
function revalidateProductionRoutes(orderId: string): void {
  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
  revalidatePath('/inventory-stock');
  revalidatePath('/inventory');
  revalidatePath('/inventory-atp');
}

// ============================================================================
// ACCIONES PRINCIPALES
// ============================================================================

/**
 * Crea una nueva orden de producción
 *
 * 1. Valida inputs y disponibilidad de stock
 * 2. Inserta la orden y recupera su id
 * 3. Genera las líneas de la orden (production_order_items)
 *    vía la función de base de datos `create_production_order_items`
 */
export async function createProductionOrder(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_ORDER_CREATE,
  );

  const recipeId = formData.get('recipe_id')?.toString().trim() ?? '';
  const plannedQuantity = Number(formData.get('planned_quantity'));
  const notes = formData.get('notes')?.toString().trim() || null;

  if (!recipeId || !plannedQuantity || plannedQuantity <= 0) {
    throw new Error('Receta y cantidad planeada son obligatorias');
  }

  await validateRecipeStockAvailability(
    supabase,
    recipeId,
    plannedQuantity,
  );

  const { data: productionOrder, error } = await supabase
    .from('production_orders')
    .insert({
      recipe_id: recipeId,
      production_number: generateOrderNumber(),
      planned_quantity: plannedQuantity,
      produced_quantity: 0,
      production_status: PRODUCTION_STATUS.DRAFT,
      notes,
    })
    .select('id')
    .single();

  if (error || !productionOrder) {
    throw new Error(
      `Error al crear orden de producción: ${error?.message ?? 'sin datos'}`,
    );
  }

  const { error: rpcError } = await supabase.rpc(
    'create_production_order_items',
    {
      p_production_order_id: productionOrder.id,
    },
  );

  if (rpcError) {
    throw new Error(
      `Error al generar los items de la orden: ${rpcError.message}`,
    );
  }

  revalidatePath('/production-orders');
  redirect('/production-orders');
}

/**
 * Libera una orden de producción (draft → released)
 */
export async function releaseProductionOrder(orderId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_ORDER_RELEASE,
  );

  const order = await getProductionOrder(supabase, orderId);

  if (order.production_status !== PRODUCTION_STATUS.DRAFT) {
    throw new Error(
      `No se puede liberar una orden en estado ${order.production_status}`,
    );
  }

  const { error } = await supabase
    .from('production_orders')
    .update({
      production_status: PRODUCTION_STATUS.RELEASED,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(`Error al liberar orden: ${error.message}`);
  }

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}

/**
 * Inicia la producción de una orden (released → in_progress)
 */
export async function startProductionOrder(orderId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_ORDER_START,
  );

  const order = await getProductionOrder(supabase, orderId);

  if (order.production_status !== PRODUCTION_STATUS.RELEASED) {
    throw new Error(
      `No se puede iniciar una orden en estado ${order.production_status}`,
    );
  }

  const { error } = await supabase
    .from('production_orders')
    .update({
      production_status: PRODUCTION_STATUS.IN_PROGRESS,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(`Error al iniciar orden: ${error.message}`);
  }

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}

/**
 * Cancela una orden de producción
 * Solo se puede cancelar desde estado 'draft' o 'released'
 */
export async function cancelProductionOrder(orderId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_ORDER_CANCEL,
  );

  const order = await getProductionOrder(supabase, orderId);

  if (!canCancelProductionOrder(order.production_status)) {
    throw new Error(
      `No se puede cancelar una orden en estado ${order.production_status}`,
    );
  }

  const { error } = await supabase
    .from('production_orders')
    .update({
      production_status: PRODUCTION_STATUS.CANCELLED,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}

/**
 * Completa una orden de producción (in_progress → completed)
 *
 * 1. Valida estado
 * 2. Obtiene receta y producto terminado
 * 3. Consume los materiales de cada item de producción
 *    delegando al Production Service (consumeProductionItem)
 * 4. Registra entrada del producto terminado
 * 5. Marca la orden como completada
 */
export async function completeProductionOrder(orderId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_ORDER_COMPLETE,
  );

  const order = await getProductionOrder(supabase, orderId);

  if (order.production_status !== PRODUCTION_STATUS.IN_PROGRESS) {
    throw new Error(
      `No se puede completar una orden en estado ${order.production_status}`,
    );
  }

  const { data: productionOrder, error: orderError } = await supabase
    .from('production_orders')
    .select('recipe_id')
    .eq('id', orderId)
    .single();

  if (orderError || !productionOrder) {
    throw new Error('No se pudo obtener la receta de la orden');
  }

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('product_id')
    .eq('id', productionOrder.recipe_id)
    .single();

  if (recipeError || !recipe?.product_id) {
    throw new Error('La receta no tiene producto asociado');
  }

  const { data: productionItems, error: itemsError } = await supabase
    .from('production_order_items')
    .select('id, raw_material_id')
    .eq('production_order_id', orderId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (!productionItems || productionItems.length === 0) {
    throw new Error('La orden no tiene items de producción.');
  }

  for (const item of productionItems) {
    const suggestedLot = await getSuggestedRawMaterialLot(
      supabase,
      item.raw_material_id,
    );

    if (!suggestedLot) {
      throw new Error(
        'No existe un lote disponible para completar el consumo de producción.',
      );
    }

    await consumeProductionItem(
      supabase,
      item.id,
      suggestedLot.lot_number,
    );
  }

  await createInventoryMovement(supabase, {
    item_type: 'product',
    item_id: recipe.product_id,
    movement_type: INVENTORY_MOVEMENT.ENTRY,
    quantity: Number(order.planned_quantity ?? 0),
    reference_type: INVENTORY_REFERENCE.PRODUCTION_ORDER,
    reference_id: orderId,
    notes: 'Producción terminada',
  });

  const { error: updateError } = await supabase
    .from('production_orders')
    .update({
      production_status: PRODUCTION_STATUS.COMPLETED,
      produced_quantity: Number(order.planned_quantity ?? 0),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidateProductionRoutes(orderId);
}
