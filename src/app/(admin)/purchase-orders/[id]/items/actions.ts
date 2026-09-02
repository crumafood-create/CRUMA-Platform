'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { buildPurchaseOrderItemInsert } from '@/modules/procurement/application/purchase-order-contract';
import { assertPurchaseOrderItemCanBeAdded } from '@/modules/procurement/application/purchase-order-repository';

export async function createPurchaseOrderItem(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_MANAGE,
  );
  const item = buildPurchaseOrderItemInsert(formData);
  await assertPurchaseOrderItemCanBeAdded(supabase, item.purchase_order_id, item.raw_material_id);
  const { error } = await supabase.rpc('add_purchase_order_item', {
    p_order_id: item.purchase_order_id,
    p_raw_material_id: item.raw_material_id,
    p_quantity: item.quantity,
    p_unit_cost: item.unit_cost ?? 0,
  });
  if (error) throw new Error('No fue posible agregar el renglón de compra.');
  revalidatePath(`/purchase-orders/${item.purchase_order_id}/items`);
  revalidatePath(`/purchase-orders/${item.purchase_order_id}`);
}
