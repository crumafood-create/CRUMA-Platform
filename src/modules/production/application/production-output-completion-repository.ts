import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  ProductionOutputCompletionRequest,
  ProductionMassLotSurplusRequest,
} from './production-output-completion-contract';

export async function completeProductionOutputToQuarantine(
  supabase: TypedSupabaseClient,
  request: ProductionOutputCompletionRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'complete_production_yield_to_quarantine',
    {
      p_idempotency_key: request.idempotencyKey,
      p_produced_quantity: request.producedQuantity,
      p_production_order_id: request.productionOrderId,
      p_variance_reason: request.varianceReason ?? '',
      p_waste_quantity: request.wasteQuantity,
    },
  );

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error('El cierre no devolvió una salida de producción.');
  }

  return data;
}

export async function completeProductionOutputWithMassLotYield(
  supabase: TypedSupabaseClient,
  request: ProductionMassLotSurplusRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'complete_production_order_with_mass_lot_yield',
    {
      p_idempotency_key:
        request.idempotencyKey,
      p_lot_surpluses: request.lotSurpluses.map((surplus) => ({
        product_lot_id: surplus.productLotId,
        surplus_quantity: surplus.surplusQuantity,
      })),
      p_produced_quantity:
        request.producedQuantity,
      p_production_order_id:
        request.productionOrderId,
      p_variance_reason:
        request.varianceReason ?? '',
      p_waste_quantity:
        request.wasteQuantity,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'El cierre no devolvió una salida de producción.',
    );
  }

  return data;
}

export async function completeProductionOrderWithMassOutput(
  supabase: TypedSupabaseClient,
  request: {
    productionOrderId: string;
    actualMassQuantity: number;
    idempotencyKey: string;
  },
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'complete_production_order_with_mass_output',
    {
      p_production_order_id: request.productionOrderId,
      p_actual_mass_quantity: request.actualMassQuantity,
      p_idempotency_key: request.idempotencyKey,
    },
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('El cierre no devolvió una salida de masa.');
  return data;
}
