import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import type { ProductionLotReleaseRequest } from './production-lot-contract';

export async function releaseProductionOutputToInventory(
  supabase: TypedSupabaseClient,
  request: ProductionLotReleaseRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'release_production_output_to_inventory',
    {
      p_expiration_date: request.expirationDate,
      p_inventory_location_id: request.inventoryLocationId,
      p_lot_number: request.lotNumber,
      p_output_id: request.productionOutputId,
      p_warehouse_id: request.warehouseId,
    },
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La liberación no devolvió un lote.');
  return data;
}
