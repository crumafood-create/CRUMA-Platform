'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';

function revalidateReceipt(orderId: string): void {
  revalidatePath('/purchase-orders');
  revalidatePath(`/purchase-orders/${orderId}`);
  revalidatePath(`/purchase-orders/${orderId}/items`);
  revalidatePath('/inventory-stock');
  revalidatePath('/inventory');
  revalidatePath('/raw-materials');
}

export async function receivePurchaseOrderItem(
  itemId: string,
  quantityReceived: number,
) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_RECEIVE,
  );
  if (!Number.isFinite(quantityReceived) || quantityReceived <= 0) {
    throw new Error('La cantidad recibida debe ser positiva y finita.');
  }
  const { data: orderId, error } = await supabase.rpc('receive_purchase_order_item', {
    p_item_id: itemId,
    p_quantity: quantityReceived,
  });
  if (error || !orderId) throw new Error('No fue posible recibir el renglón de compra.');
  revalidateReceipt(orderId);
}

export async function receivePurchaseOrder(orderId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_RECEIVE,
  );
  const { data, error } = await supabase.rpc('receive_purchase_order', {
    p_order_id: orderId,
  });
  if (error || !data) throw new Error('No fue posible recibir la orden de compra.');
  revalidateReceipt(orderId);
}
