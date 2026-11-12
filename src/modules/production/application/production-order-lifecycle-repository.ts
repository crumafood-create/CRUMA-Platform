import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  ProductionOrderCreationRequest,
  ProductionOrderMassStartRequest,
  ProductionOrderTransitionRequest,
} from './production-order-lifecycle-contract';

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

export async function startProductionOrderWithMassLotReservations(
  supabase: TypedSupabaseClient,
  request: ProductionOrderMassStartRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'start_production_order_with_mass_lot_reservations',
    {
      p_production_order_id: request.productionOrderId,
      p_lot_allocations: request.lotReservations.map((reservation) => ({
        product_lot_id: reservation.productLotId,
        quantity: reservation.quantity,
      })),
      p_idempotency_key: request.idempotencyKey,
    },
  );

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error('El inicio no devolvió una orden de producción.');
  }

  return data;
}

export async function startProductionOrderWithMassSurplusReuse(
  supabase: TypedSupabaseClient,
  request: {
    productionOrderId: string;
    reservationIds: string[];
    idempotencyKey: string;
  },
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'start_production_order_with_mass_surplus_reuse',
    {
      p_production_order_id: request.productionOrderId,
      p_reservation_ids: request.reservationIds,
      p_idempotency_key: request.idempotencyKey,
    },
  );

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error('El inicio no devolvió una orden de producción.');
  }
  return data;
}

export async function disposeProductionMassSurplusAsWaste(
  supabase: TypedSupabaseClient,
  reservationId: string,
  reason: string,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'dispose_production_mass_surplus_as_waste',
    { p_reservation_id: reservationId, p_reason: reason },
  );

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se confirmó el destino de merma.');
  return data;
}
