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
import {
  requireTypedAuthorizedAction,
} from '@/modules/identity/guards/action.guard';
import {
  PERMISSIONS,
} from '@/modules/identity/permissions/permissions.constants';
import {
  buildProductionMaterialConsumptionRequest,
} from '@/modules/production/application/production-material-consumption-contract';
import {
  consumeProductionMaterialFefo,
} from '@/modules/production/application/production-material-consumption-repository';

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
  idempotencyKey: string,
): Promise<void> {
  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.PRODUCTION_MATERIAL_CONSUME,
    );

  const request =
    buildProductionMaterialConsumptionRequest({
      productionOrderItemId:
        productionItemId,
      scannedLotNumber,
      idempotencyKey,
    });

  const orderId =
    await consumeProductionMaterialFefo(
      supabase,
      request,
    );

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
