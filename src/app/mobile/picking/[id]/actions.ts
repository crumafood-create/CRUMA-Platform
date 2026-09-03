'use server';

import { revalidatePath } from 'next/cache';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';

import { getSuggestedLot, type SuggestedLot } from '../actions';

export type PickingOrderStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PickingOrder = {
  id: string;
  status: PickingOrderStatus;
  sales_order_id: string;
  created_at?: string;
  completed_at: string | null;
};

export type PickingProduct = {
  id: string;
  name: string;
};

export type PickingLot = {
  lot_number: string;
} | null;

export type PickingDetailItem = {
  id: string;
  picking_order_id: string;
  product_id: string;
  quantity: number;
  picked_quantity: number;
  status: string;
  product: PickingProduct | null;
  picked_lot: PickingLot;
  suggested_lot: SuggestedLot;
};

export type PickingDetail = {
  picking: {
    id: string;
    status: string;
    sales_order_id: string;
  };
  items: PickingDetailItem[];
};

export async function confirmPicking(
  pickingItemId: string,
  lotNumber: string,
) {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_ORDER_PREPARE);
  const scannedLotNumber = lotNumber.trim();
  if (!scannedLotNumber) throw new Error('El lote es obligatorio.');
  const { data: pickingId, error } = await supabase.rpc('confirm_picking_item', {
    p_picking_item_id: pickingItemId,
    p_lot_number: scannedLotNumber,
  });
  if (error || !pickingId) throw new Error(error?.message ?? 'No fue posible confirmar el picking.');
  revalidatePath('/mobile/picking');
  revalidatePath(`/mobile/picking/${pickingId}`);
  revalidatePath('/sales-orders');
}

export async function getPickingDetail(
  pickingId: string,
): Promise<PickingDetail> {
  const supabase = await createTypedClient();

  const { data: picking, error: pickingError } = await supabase
    .from('picking_orders')
    .select(`
      id,
      status,
      sales_order_id,
      completed_at
    `)
    .eq('id', pickingId)
    .single();

  if (pickingError || !picking) {
    throw new Error('Picking no encontrado.');
  }

  const { data: items, error: itemsError } = await supabase
    .from('picking_order_items')
    .select(`
      id,
      picking_order_id,
      product_id,
      quantity,
      picked_quantity,
      status,
      product_lot_id,
      products (
        id,
        name
      ),
      product_lots (
        id,
        lot_number
      )
    `)
    .eq('picking_order_id', pickingId)
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const normalizedItems: PickingDetailItem[] = await Promise.all(
    (items ?? []).map(async (row) => {
      const rawProduct = row.products;
      const product = Array.isArray(rawProduct)
        ? rawProduct[0] ?? null
        : rawProduct ?? null;

      const rawPickedLot = row.product_lots;
      const pickedLot = Array.isArray(rawPickedLot)
        ? rawPickedLot[0] ?? null
        : rawPickedLot ?? null;

      const suggestedLot = product?.id
        ? await getSuggestedLot(product.id)
        : null;

      return {
        id: row.id,
        picking_order_id: row.picking_order_id,
        product_id: row.product_id,
        quantity: Number(row.quantity ?? 0),
        picked_quantity: Number(row.picked_quantity ?? 0),
        status: row.status ?? 'pending',
        product,
        suggested_lot: suggestedLot,
        picked_lot: pickedLot
          ? {
              lot_number: pickedLot.lot_number ?? '',
            }
          : null,
      };
    }),
  );

  return {
    picking: {
      id: picking.id,
      status: picking.status,
      sales_order_id: picking.sales_order_id,
    },
    items: normalizedItems,
  };
}
