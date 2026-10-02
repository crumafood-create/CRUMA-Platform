'use server';

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
  buildProductionOrderCreationRequest,
  buildProductionOrderTransitionRequest,
} from '@/modules/production/application/production-order-lifecycle-contract';
import {
  createProductionOrderDraft,
  transitionProductionOrderLifecycle,
} from '@/modules/production/application/production-order-lifecycle-repository';
import {
  calculateRequiredQuantity,
  sumAvailableStock,
} from '@/modules/production/application/production-order-contract';

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
 * Crea atómicamente una orden en borrador y su plan
 * de materiales.
 */
export async function createProductionOrder(
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.PRODUCTION_ORDER_CREATE,
    );

  const request =
    buildProductionOrderCreationRequest({
      recipeId:
        formData.get('recipe_id'),
      plannedQuantity: Number(
        formData.get('planned_quantity'),
      ),
      notes:
        formData.get('notes'),
      idempotencyKey:
        formData.get('idempotency_key'),
    });

  await validateRecipeStockAvailability(
    supabase,
    request.recipeId,
    request.plannedQuantity,
  );

  await createProductionOrderDraft(
    supabase,
    request,
  );

  revalidatePath('/production-orders');
  redirect('/production-orders');
}

/**
 * Libera atómicamente una orden:
 * draft → released.
 */
export async function releaseProductionOrder(
  orderId: string,
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.PRODUCTION_ORDER_RELEASE,
    );

  const request =
    buildProductionOrderTransitionRequest({
      productionOrderId: orderId,
      transition: 'release',
      reason:
        formData.get('reason'),
      idempotencyKey:
        formData.get('idempotency_key'),
    });

  const transitionedOrderId =
    await transitionProductionOrderLifecycle(
      supabase,
      request,
    );

  revalidatePath('/production-orders');
  revalidatePath(
    `/production-orders/${transitionedOrderId}`,
  );
}

/**
 * Inicia atómicamente una orden:
 * released → in_progress.
 */
export async function startProductionOrder(
  orderId: string,
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.PRODUCTION_ORDER_START,
    );

  const request =
    buildProductionOrderTransitionRequest({
      productionOrderId: orderId,
      transition: 'start',
      reason:
        formData.get('reason'),
      idempotencyKey:
        formData.get('idempotency_key'),
    });

  const transitionedOrderId =
    await transitionProductionOrderLifecycle(
      supabase,
      request,
    );

  revalidatePath('/production-orders');
  revalidatePath(
    `/production-orders/${transitionedOrderId}`,
  );
}

/**
 * Cancela atómicamente una orden desde draft o
 * released y conserva el motivo en auditoría.
 */
export async function cancelProductionOrder(
  orderId: string,
  formData: FormData,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.PRODUCTION_ORDER_CANCEL,
    );

  const request =
    buildProductionOrderTransitionRequest({
      productionOrderId: orderId,
      transition: 'cancel',
      reason:
        formData.get('reason'),
      idempotencyKey:
        formData.get('idempotency_key'),
    });

  const transitionedOrderId =
    await transitionProductionOrderLifecycle(
      supabase,
      request,
    );

  revalidatePath('/production-orders');
  revalidatePath(
    `/production-orders/${transitionedOrderId}`,
  );
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

  const wasteQuantity =
    formData.get('waste_quantity');

  const request =
    buildProductionOutputCompletionRequest({
      productionOrderId: orderId,
      producedQuantity: Number(
        formData.get('produced_quantity'),
      ),
      wasteQuantity:
        typeof wasteQuantity === 'string' &&
        wasteQuantity.trim() !== ''
          ? Number(wasteQuantity)
          : wasteQuantity,
      varianceReason:
        formData.get('variance_reason'),
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