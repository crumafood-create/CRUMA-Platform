'use server';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import type {
  MobileProductionDetail,
  MobileProductionItem,
  MobileProductionOrderSummary,
} from '@/modules/production/application/mobile-production-contract';
import {
  fetchMobileProductionDetail,
  fetchMobileProductionOrders,
} from '@/modules/production/application/mobile-production-repository';
import type { ProductionStatus } from '@/modules/production/domain/constants';

export type ProductionOrderStatus = ProductionStatus;
export type ProductionOrderSummary = MobileProductionOrderSummary;
export type ProductionOrderDetailItem = MobileProductionItem;
export type ProductionOrderDetail = MobileProductionDetail;

export async function getProductionOrders(): Promise<ProductionOrderSummary[]> {
  return fetchMobileProductionOrders(await createTypedClient());
}

export async function getProductionDetail(
  orderId: string,
): Promise<ProductionOrderDetail> {
  return fetchMobileProductionDetail(await createTypedClient(), orderId);
}
