import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  ProductionOutputCompletionRequest,
} from './production-output-completion-contract';

export async function completeProductionOutputToQuarantine(
  supabase: TypedSupabaseClient,
  request: ProductionOutputCompletionRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'complete_production_output_quarantine',
    {
      p_idempotency_key:
        request.idempotencyKey,
      p_produced_quantity:
        request.producedQuantity,
      p_production_order_id:
        request.productionOrderId,
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