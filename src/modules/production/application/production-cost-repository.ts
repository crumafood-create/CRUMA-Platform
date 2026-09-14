import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import type { ProductionCostRequest } from './production-cost-contract';

export async function calculateProductionCost(
  supabase: TypedSupabaseClient,
  request: ProductionCostRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc('calculate_production_cost', {
    p_labor_cost: request.laborCost,
    p_order_id: request.productionOrderId,
    p_overhead_cost: request.overheadCost,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La base de datos no devolvió el costo calculado.');
  return data;
}
