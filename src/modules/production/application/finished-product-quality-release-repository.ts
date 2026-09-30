import type {
  TypedSupabaseClient,
} from '@/infrastructure/integrations/supabase/database.types';

import type {
  FinishedProductQualityReleaseRequest,
} from './finished-product-quality-release-contract';

export async function releaseFinishedProductQualityToInventory(
  supabase: TypedSupabaseClient,
  request: FinishedProductQualityReleaseRequest,
): Promise<string> {
  const { data, error } =
    await supabase.rpc(
      'release_finished_product_quality_to_inventory',
      {
        p_expiration_date:
          request.expirationDate,
        p_idempotency_key:
          request.idempotencyKey,
        p_inspection_id:
          request.qualityInspectionId,
        p_inventory_location_id:
          request.inventoryLocationId,
        p_lot_number:
          request.lotNumber,
        p_reason:
          request.reason ?? '',
        p_warehouse_id:
          request.warehouseId,
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'La liberación no devolvió un lote de producto terminado.',
    );
  }

  return data;
}