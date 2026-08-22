'use server';

import { revalidatePath } from 'next/cache';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import type {
  MobileProductionItem,
  MobileProductionOrder,
} from '@/modules/production/application/mobile-production-contract';
import {
  getSuggestedRawMaterialLot,
  type SuggestedRawMaterialLot,
} from '@/modules/production/application/production-lot';
import { fetchMobileProductionDetail } from '@/modules/production/application/mobile-production-repository';
import { consumeProductionItem } from '@/modules/production/application/production-service';

export type SuggestedLot = SuggestedRawMaterialLot | null;

export type ProductionDetailItem = MobileProductionItem & {
  suggested_lot: SuggestedLot;
};

export type ProductionDetail = {
  order: MobileProductionOrder;
  items: ProductionDetailItem[];
};

export async function confirmProductionItem(
  productionItemId: string,
  scannedLotNumber: string,
): Promise<void> {
  const supabase = await createTypedClient();

  await consumeProductionItem(supabase, productionItemId, scannedLotNumber);

  const { data: item, error } = await supabase
    .from('production_order_items')
    .select('production_order_id')
    .eq('id', productionItemId)
    .single();

  if (error || !item) {
    throw new Error(error?.message ?? 'Item no encontrado.');
  }

  const orderId = item.production_order_id;

  for (const path of [
    '/mobile/production',
    `/mobile/production/${orderId}`,
    '/production-orders',
    `/production-orders/${orderId}`,
    '/inventory',
    '/inventory-stock',
  ]) {
    revalidatePath(path);
  }
}

export async function getProductionDetail(
  productionOrderId: string,
): Promise<ProductionDetail> {
  const supabase = await createTypedClient();
  const detail = await fetchMobileProductionDetail(supabase, productionOrderId);

  const items = await Promise.all(
    detail.items.map(async (item) => ({
      ...item,
      suggested_lot: await getSuggestedRawMaterialLot(
        supabase,
        item.raw_material_id,
      ),
    })),
  );

  return {
    ...detail,
    items,
  };
}
