'use server';

import crypto from 'crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';
import { requireAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { getSuggestedRawMaterialLot } from '@/modules/production/application/production-lot';
import { consumeProductionItem } from '@/modules/production/application/production-service';
import {
  INVENTORY_MOVEMENT,
  INVENTORY_REFERENCE,
  PRODUCTION_STATUS,
} from '@/modules/production/domain/constants';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type RecipeItemRow = {
  raw_material_id: string;
  quantity: number | null;
};

type ProductionOrderRow = {
  id: string;
  recipe_id: string;
  planned_quantity: number | null;
  produced_quantity: number | null;
  status: string;
  notes: string | null;
};

type ProductionOrderWithRecipe = {
  recipe_id: string;
  recipes:
    | {
        product_id: string | null;
      }
    | {
        product_id: string | null;
      }[]
    | null;
};

function unwrapSingle<T>(
  value: T | T[] | null | undefined,
): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

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
  supabase: SupabaseClient,
  orderId: string,
): Promise<ProductionOrderRow> {
  const { data: order, error } = await supabase
    .from('production_orders')
    .select(`
      id,
      recipe_id,
      planned_quantity,
      produced_quantity,
      status,
      notes
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(error?.message ?? 'Orden de producción no encontrada');
  }

  return order as ProductionOrderRow;
}

/**
 * Valida que hay suficiente stock para los ingredientes de una receta
 * usando raw_material_lots como fuente de verdad.
 */
async function validateRecipeStockAvailability(
  supabase: SupabaseClient,
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

  const items = (recipeItems ?? []) as RecipeItemRow[];

  if (items.length === 0) {
    return true;
  }

  for (const item of items) {
    const requiredPerUnit = Number(item.quantity ?? 0);
    const required = requiredPerUnit * plannedQuantity;

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

    const available = (lots ?? []).reduce((sum, lot) => {
      return sum + Number(lot.quantity ?? 0);
    }, 0);

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
  supabase: SupabaseClient,
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
  const { supabase } = await requireAuthorizedAction(
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
      order_number: generateOrderNumber(),
      planned_quantity: plannedQuantity,
      produced_quantity: 0,
      status: PRODUCTION_STATUS.DRAFT,
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
  const supabase = await createClient();

  const order = await getProductionOrder(supabase, orderId);

  if (order.status !== PRODUCTION_STATUS.DRAFT) {
    throw new Error(`No se puede liberar una orden en estado ${order.status}`);
  }

  const { error } = await supabase
    .from('production_orders')
    .update({
      status: PRODUCTION_STATUS.RELEASED,
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
  const supabase = await createClient();

  const order = await getProductionOrder(supabase, orderId);

  if (order.status !== PRODUCTION_STATUS.RELEASED) {
    throw new Error(`No se puede iniciar una orden en estado ${order.status}`);
  }

  const { error } = await supabase
    .from('production_orders')
    .update({
      status: PRODUCTION_STATUS.IN_PROGRESS,
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
  const supabase = await createClient();

  const order = await getProductionOrder(supabase, orderId);

  const cancelableStates = [
    PRODUCTION_STATUS.DRAFT,
    PRODUCTION_STATUS.RELEASED,
  ];

  if (!cancelableStates.includes(order.status as any)) {
    throw new Error(
      `No se puede cancelar una orden en estado ${order.status}`,
    );
  }

  const { error } = await supabase
    .from('production_orders')
    .update({
      status: PRODUCTION_STATUS.CANCELLED,
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
  const supabase = await createClient();

  const order = await getProductionOrder(supabase, orderId);

  if (order.status !== PRODUCTION_STATUS.IN_PROGRESS) {
    throw new Error(
      `No se puede completar una orden en estado ${order.status}`,
    );
  }

  const { data: productionOrder, error: orderError } = await supabase
    .from('production_orders')
    .select(`
      recipe_id,
      planned_quantity,
      recipes (
        product_id
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !productionOrder) {
    throw new Error('No se pudo obtener la receta de la orden');
  }

  const typedProductionOrder = productionOrder as ProductionOrderWithRecipe & {
    planned_quantity: number;
  };

  const recipe = unwrapSingle(
    typedProductionOrder.recipes,
  );

  if (!recipe?.product_id) {
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
      status: PRODUCTION_STATUS.COMPLETED,
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
