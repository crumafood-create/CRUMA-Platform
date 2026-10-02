import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  ProductionCostRequest,
} from './production-cost-contract';

export async function calculateProductionCost(
  supabase: TypedSupabaseClient,
  request: ProductionCostRequest,
): Promise<string> {
  const { data, error } =
    await supabase.rpc(
      'settle_production_cost',
      {
        p_idempotency_key:
          request.idempotencyKey,
        p_labor_cost:
          request.laborCost,
        p_overhead_cost:
          request.overheadCost,
        p_production_order_id:
          request.productionOrderId,
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'La base de datos no devolvió el costo calculado.',
    );
  }

  return data;
}
