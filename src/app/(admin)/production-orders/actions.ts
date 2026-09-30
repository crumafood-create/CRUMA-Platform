'use server';

import crypto from 'crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  buildProductionOutputCompletionRequest,
} from '@/modules/production/application/production-output-completion-contract';
import {
  completeProductionOutputToQuarantine,
} from '@/modules/production/application/production-output-completion-repository';
import {
  canCancelProductionOrder,
  calculateRequiredQuantity,
  sumAvailableStock,
  toProductionOrderState,
  type ProductionOrderState,
} from '@/modules/production/application/production-order-contract';
import {
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

    const { data: lots, error: lotsError } =
  await supabase
    .from('raw_material_lots')
    .select('quantity')
    .eq(
      'raw_material_id',
      item.raw_material_id,
    )
    .eq('status', 'available')
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
 * 1. Valida el estado de la orden.
 * 2. Exige que todos los materiales hayan sido consumidos físicamente.
 * 3. Registra la entrada del producto terminado.
 * 4. Marca la orden como completada.
 */
export async function completeProductionOrder(
  orderId: string,
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.PRODUCTION_ORDER_COMPLETE,
    );

  const request =
    buildProductionOutputCompletionRequest({
      productionOrderId: orderId,
      producedQuantity: Number(
        formData.get('produced_quantity'),
      ),
      idempotencyKey:
        formData.get('idempotency_key'),
    });

  await completeProductionOutputToQuarantine(
    supabase,
    request,
  );

  revalidateProductionRoutes(orderId);
  revalidatePath('/qa');
}