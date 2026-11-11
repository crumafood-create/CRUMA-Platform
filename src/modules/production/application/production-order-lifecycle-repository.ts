import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  ProductionOrderCreationRequest,
  ProductionOrderTransitionRequest,
} from './production-order-lifecycle-contract';

const INTERMEDIATE_RECIPE_ORDER_MESSAGE =
  'Las órdenes de producción todavía no admiten productos intermedios como ingredientes.';

export class IntermediateRecipeProductionUnsupportedError extends Error {
  constructor() {
    super(INTERMEDIATE_RECIPE_ORDER_MESSAGE);
    this.name = 'IntermediateRecipeProductionUnsupportedError';
  }
}

export async function assertRecipeSupportsProductionOrder(
  supabase: TypedSupabaseClient,
  recipeId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('recipe_items')
    .select('product_id')
    .eq('recipe_id', recipeId);

  if (error) throw new Error(error.message);

  const items = data ?? [];

  if (items.some((item) => item.product_id)) {
    throw new IntermediateRecipeProductionUnsupportedError();
  }
}

export async function createProductionOrderDraft(
  supabase: TypedSupabaseClient,
  request: ProductionOrderCreationRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'create_production_order_draft',
    {
      p_idempotency_key:
        request.idempotencyKey,
      p_notes:
        request.notes ?? '',
      p_planned_quantity:
        request.plannedQuantity,
      p_recipe_id:
        request.recipeId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'La creación no devolvió una orden de producción.',
    );
  }

  return data;
}

export async function transitionProductionOrderLifecycle(
  supabase: TypedSupabaseClient,
  request: ProductionOrderTransitionRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'transition_production_order_lifecycle',
    {
      p_idempotency_key:
        request.idempotencyKey,
      p_production_order_id:
        request.productionOrderId,
      p_reason:
        request.reason ?? '',
      p_transition:
        request.transition,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'La transición no devolvió una orden de producción.',
    );
  }

  return data;
}
