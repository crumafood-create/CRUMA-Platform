import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  ProductionMaterialConsumptionRequest,
} from './production-material-consumption-contract';

type ConsumeProductionMaterialFefoRpc = (
  functionName:
    'consume_production_material_fefo',
  parameters: {
    p_idempotency_key: string;
    p_production_order_item_id: string;
    p_scanned_lot_number: string;
  },
) => Promise<{
  data: string | null;
  error: {
    message: string;
  } | null;
}>;

export async function consumeProductionMaterialFefo(
  supabase: TypedSupabaseClient,
  request: ProductionMaterialConsumptionRequest,
): Promise<string> {
  const consumeMaterial =
    supabase.rpc as unknown as
      ConsumeProductionMaterialFefoRpc;

  const { data, error } =
    await consumeMaterial(
      'consume_production_material_fefo',
      {
        p_idempotency_key:
          request.idempotencyKey,
        p_production_order_item_id:
          request.productionOrderItemId,
        p_scanned_lot_number:
          request.scannedLotNumber,
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'El consumo no devolvió una orden de producción.',
    );
  }

  return data;
}