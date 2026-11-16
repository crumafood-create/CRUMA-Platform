import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import {
  fetchMobileProductionOrders,
} from '@/modules/production/application/mobile-production-repository';
import type {
  MobileProductionOrderSummary,
} from '@/modules/production/application/mobile-production-contract';

export type ProductionOrderSummary = {
  id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  status: 'draft' | 'released' | 'in_progress' | 'completed' | 'cancelled' | string;
  created_at?: string;
};

export function toProductionOrderSummaries(
  orders: readonly MobileProductionOrderSummary[],
): ProductionOrderSummary[] {
  return orders
    .filter(
      (order) =>
        order.production_status === 'released' ||
        order.production_status === 'in_progress',
    )
    .map((order) => ({
      id: order.id,
      order_number: order.production_number,
      product_name: order.recipe_name,
      quantity: order.planned_quantity,
      status: order.production_status,
      created_at: order.created_at,
    }));
}

/** Obtiene las órdenes liberadas o en producción para la lista móvil. */
export async function getProductionOrders(): Promise<ProductionOrderSummary[]> {
  const orders = await fetchMobileProductionOrders(await createTypedClient());
  return toProductionOrderSummaries(orders);
}
