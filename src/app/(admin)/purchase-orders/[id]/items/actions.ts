'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  buildPurchaseOrderItemInsert,
  buildPurchaseOrderPresentationInput,
} from '@/modules/procurement/application/purchase-order-contract';
import { assertPurchaseOrderItemCanBeAdded } from '@/modules/procurement/application/purchase-order-repository';

type AddPurchaseOrderItemWithPresentationRpc = (
  functionName: 'add_purchase_order_item_with_presentation',
  parameters: {
    p_order_id: string;
    p_raw_material_id: string;
    p_presentation_mode: 'base_unit' | 'sealed_package';
    p_purchase_quantity: number;
    p_base_quantity_per_presentation: number;
    p_purchase_unit_price: number;
  },
) => Promise<{ error: { message: string } | null }>;

type UpdatePurchaseOrderItemPresentationRpc = (
  functionName: 'update_purchase_order_item_presentation',
  parameters: {
    p_item_id: string;
    p_presentation_mode: 'base_unit' | 'sealed_package';
    p_purchase_quantity: number;
    p_base_quantity_per_presentation: number;
    p_purchase_unit_price: number;
  },
) => Promise<{ error: { message: string } | null }>;

type DeletePurchaseOrderItemRpc = (
  functionName: 'delete_purchase_order_item',
  parameters: { p_item_id: string },
) => Promise<{ error: { message: string } | null }>;

export async function createPurchaseOrderItem(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_MANAGE,
  );
  const item = buildPurchaseOrderItemInsert(formData);
  await assertPurchaseOrderItemCanBeAdded(supabase, item.purchase_order_id, item.raw_material_id);
  const addItem = supabase.rpc.bind(supabase) as unknown as
    AddPurchaseOrderItemWithPresentationRpc;
  const { error } = await addItem('add_purchase_order_item_with_presentation', {
    p_order_id: item.purchase_order_id,
    p_raw_material_id: item.raw_material_id,
    p_presentation_mode: item.presentation_mode,
    p_purchase_quantity: item.purchase_quantity,
    p_base_quantity_per_presentation: item.base_quantity_per_presentation,
    p_purchase_unit_price: item.purchase_unit_price,
  });
  if (error) throw new Error('No fue posible agregar el renglón de compra.');
  revalidatePath(`/purchase-orders/${item.purchase_order_id}/items`);
  revalidatePath(`/purchase-orders/${item.purchase_order_id}`);
}

export async function updatePurchaseOrderItem(itemId: string, formData: FormData) {
  const orderId = formData.get('purchase_order_id')?.toString() ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(itemId) || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    throw new Error('Renglón de compra inválido.');
  }
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_MANAGE,
  );
  const presentation = buildPurchaseOrderPresentationInput(formData);
  const updateItem = supabase.rpc.bind(supabase) as unknown as
    UpdatePurchaseOrderItemPresentationRpc;
  const { error } = await updateItem('update_purchase_order_item_presentation', {
    p_item_id: itemId,
    p_presentation_mode: presentation.presentation_mode,
    p_purchase_quantity: presentation.purchase_quantity,
    p_base_quantity_per_presentation: presentation.base_quantity_per_presentation,
    p_purchase_unit_price: presentation.purchase_unit_price,
  });
  if (error) throw new Error('No fue posible actualizar el renglón de compra.');
  revalidatePath('/purchase-orders');
  revalidatePath(`/purchase-orders/${orderId}`);
  revalidatePath(`/purchase-orders/${orderId}/items`);
}

export async function deletePurchaseOrderItem(itemId: string, orderId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(itemId) || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    throw new Error('Renglón de compra inválido.');
  }
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_MANAGE,
  );
  const deleteItem = supabase.rpc.bind(supabase) as unknown as DeletePurchaseOrderItemRpc;
  const { error } = await deleteItem('delete_purchase_order_item', { p_item_id: itemId });
  if (error) throw new Error('No fue posible retirar el renglón de compra.');
  revalidatePath('/purchase-orders');
  revalidatePath(`/purchase-orders/${orderId}`);
  revalidatePath(`/purchase-orders/${orderId}/items`);
}
