'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  buildProductionMassLotSurplusRequest,
  buildProductionOutputCompletionRequest,
} from '@/modules/production/application/production-output-completion-contract';
import {
  completeProductionOutputToQuarantine,
  completeProductionOutputWithMassLotYield,
  completeProductionOrderWithMassOutput,
} from '@/modules/production/application/production-output-completion-repository';
import {
  buildProductionOrderMassStartRequest,
  buildProductionOrderCreationRequest,
  buildProductionOrderTransitionRequest,
} from '@/modules/production/application/production-order-lifecycle-contract';
import {
  createProductionOrderDraft,
  disposeProductionMassSurplusAsWaste,
  startProductionOrderWithMassSurplusReuse,
  startProductionOrderWithMassLotReservations,
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
    .select('id, yield_quantity')
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
    if (!item.raw_material_id) {
      // Product intermediates are weighed and reserved from released lots
      // when the order starts, not while it is planned.
      continue;
    }

    const rawMaterialId = item.raw_material_id;
    const required = calculateRequiredQuantity(
      item.quantity,
      plannedQuantity,
      recipe.yield_quantity,
    );

    const { data: lots, error: lotsError } =
  await supabase
    .from('raw_material_lots')
    .select('quantity')
    .eq(
      'raw_material_id',
      rawMaterialId,
    )
    .eq('status', 'available')
    .gt('quantity', 0);

    if (lotsError) {
      throw new Error(
        `No se puede verificar stock para ingrediente ${rawMaterialId}: ${lotsError.message}`,
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
  _previousState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
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

  let transitionedOrderId: string;

  if (request.transition === 'start') {
    const { data: massItems, error } = await supabase
      .from('production_order_items')
      .select('*')
      .eq('production_order_id', orderId);

    if (error) throw new Error(error.message);

    const hasMassIngredient = (massItems ?? []).some(
      (item) => item.product_id !== null,
    );
    const surplusReservations = [...formData.entries()]
      .flatMap(([name, value]) => {
        const prefix = 'reuse_mass_surplus_';
        return name.startsWith(prefix) && value === 'on'
          ? [name.slice(prefix.length)]
          : [];
      });

    if (hasMassIngredient) {
      const reservations = [...formData.entries()]
        .flatMap(([name, value]) => {
          const prefix = 'mass_lot_';
          if (!name.startsWith(prefix) || typeof value !== 'string') return [];
          if (!value.trim()) return [];

          return [{
            productLotId: name.slice(prefix.length),
            quantity: Number(value),
          }];
        });

      transitionedOrderId = await startProductionOrderWithMassLotReservations(
        supabase,
        buildProductionOrderMassStartRequest({
          productionOrderId: orderId,
          lotReservations: reservations,
          idempotencyKey: request.idempotencyKey,
        }),
      );
    } else if (surplusReservations.length > 0) {
      transitionedOrderId = await startProductionOrderWithMassSurplusReuse(
        supabase,
        {
          productionOrderId: orderId,
          reservationIds: surplusReservations,
          idempotencyKey: request.idempotencyKey,
        },
      );
    } else {
      transitionedOrderId = await transitionProductionOrderLifecycle(
        supabase,
        request,
      );
    }
  } else {
    transitionedOrderId = await transitionProductionOrderLifecycle(
      supabase,
      request,
    );
  }

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

  const completionInput = {
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
    };

  const { data: orderItems, error: orderItemsError } = await supabase
    .from('production_order_items')
    .select('product_id, raw_material_id')
    .eq('production_order_id', orderId);

  if (orderItemsError) {
    throw new Error('No fue posible comprobar los ingredientes de la orden.');
  }
  const { data: orderHeader, error: orderHeaderError } = await supabase
    .from('production_orders')
    .select('recipe_id')
    .eq('id', orderId)
    .single();
  if (orderHeaderError || !orderHeader) {
    throw new Error('No fue posible identificar la receta de la orden.');
  }

  const usesIntermediateProduct = (orderItems ?? []).some(
    (item) => item.product_id !== null && item.raw_material_id === null,
  );
  const { data: outputRecipe, error: outputRecipeError } = await supabase
    .from('recipes')
    .select('product_id')
    .eq('id', orderHeader.recipe_id)
    .single();
  if (outputRecipeError || !outputRecipe) {
    throw new Error('No fue posible identificar el producto de la receta.');
  }
  const { count: intermediateUseCount, error: intermediateUseError } = await supabase
    .from('recipe_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', outputRecipe.product_id);
  if (intermediateUseError) {
    throw new Error('No fue posible identificar si la salida es una masa intermedia.');
  }

  if (usesIntermediateProduct) {
    const lotSurpluses = [...formData.entries()]
      .flatMap(([name, value]) => {
        const prefix = 'mass_surplus_';
        return name.startsWith(prefix)
          ? [{
              productLotId: name.slice(prefix.length),
              surplusQuantity: value,
            }]
          : [];
      });

    const request = buildProductionMassLotSurplusRequest({
      ...completionInput,
      lotSurpluses,
    });

    await completeProductionOutputWithMassLotYield(
      supabase,
      request,
    );
  } else if ((intermediateUseCount ?? 0) > 0) {
    await completeProductionOrderWithMassOutput(supabase, {
      productionOrderId: orderId,
      actualMassQuantity: Number(formData.get('actual_mass_quantity')),
      idempotencyKey: String(formData.get('idempotency_key') ?? ''),
    });
  } else {
    const request = buildProductionOutputCompletionRequest(completionInput);

    await completeProductionOutputToQuarantine(
      supabase,
      request,
    );
  }

  revalidateProductionRoutes(orderId);
  revalidatePath('/qa');
}

export async function disposeMassSurplusAsWaste(
  reservationId: string,
  formData: FormData,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_ORDER_COMPLETE,
  );
  const reason = formData.get('reason');
  if (typeof reason !== 'string' || !reason.trim()) {
    throw new Error('Indica por qué el sobrante se registra como merma.');
  }
  await disposeProductionMassSurplusAsWaste(
    supabase,
    reservationId,
    reason,
  );
  revalidatePath('/production-orders');
}
