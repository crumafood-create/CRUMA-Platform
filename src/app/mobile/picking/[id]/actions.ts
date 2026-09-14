'use server';

import { revalidatePath } from 'next/cache';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';

import { getSuggestedLot, type SuggestedLot } from '../actions';

export type PickingAllocation = {
  quantity: number;
  lotNumber: string;
};

export type PickingDetailItem = {
  id: string;
  picking_order_id: string;
  product_id: string;
  quantity: number;
  picked_quantity: number;
  status: string;
  product: { id: string; name: string } | null;
  picked_lot: { lot_number: string } | null;
  suggested_lot: SuggestedLot;
  allocations: PickingAllocation[];
};

export type PickingDetail = {
  picking: { id: string; status: string; sales_order_id: string };
  items: PickingDetailItem[];
};

export async function confirmPicking(
  pickingItemId: string,
  lotNumber: string,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.SALES_ORDER_PREPARE,
  );
  const scannedLotNumber = lotNumber.trim();
  if (!scannedLotNumber) throw new Error('El lote es obligatorio.');
  const { data: pickingId, error } = await supabase.rpc('confirm_picking_item', {
    p_picking_item_id: pickingItemId,
    p_lot_number: scannedLotNumber,
  });
  if (error || !pickingId) {
    throw new Error(error?.message ?? 'No fue posible confirmar el picking.');
  }
  revalidatePath('/mobile/picking');
  revalidatePath(`/mobile/picking/${pickingId}`);
  revalidatePath('/sales-orders');
}

export async function getPickingDetail(pickingId: string): Promise<PickingDetail> {
  const supabase = await createTypedClient();
  const { data: picking, error: pickingError } = await supabase
    .from('picking_orders').select('id, status, sales_order_id')
    .eq('id', pickingId).single();
  if (pickingError || !picking) throw new Error('Picking no encontrado.');

  const { data: items, error } = await supabase.from('picking_order_items').select(`
    id, picking_order_id, product_id, quantity, picked_quantity, status,
    products(id, name),
    product_lots(lot_number),
    picking_lot_allocations(quantity, product_lots(lot_number))
  `).eq('picking_order_id', pickingId).order('created_at');
  if (error) throw new Error(error.message);

  const normalized = await Promise.all((items ?? []).map(async (row) => {
    const product = Array.isArray(row.products) ? row.products[0] ?? null : row.products;
    const pickedLot = Array.isArray(row.product_lots)
      ? row.product_lots[0] ?? null : row.product_lots;
    const allocations = (row.picking_lot_allocations ?? []).map((allocation) => {
      const lot = Array.isArray(allocation.product_lots)
        ? allocation.product_lots[0] ?? null : allocation.product_lots;
      return { quantity: Number(allocation.quantity), lotNumber: lot?.lot_number ?? '-' };
    });
    return {
      id: row.id,
      picking_order_id: row.picking_order_id,
      product_id: row.product_id,
      quantity: Number(row.quantity),
      picked_quantity: Number(row.picked_quantity),
      status: row.status,
      product,
      picked_lot: pickedLot ? { lot_number: pickedLot.lot_number } : null,
      suggested_lot: product ? await getSuggestedLot(product.id) : null,
      allocations,
    };
  }));

  return {
    picking: {
      id: picking.id,
      status: picking.status,
      sales_order_id: picking.sales_order_id,
    },
    items: normalized,
  };
}
