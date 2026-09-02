'use server';

import crypto from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { buildPurchaseOrderInsert } from '@/modules/procurement/application/purchase-order-contract';
import {
  assertPurchaseOrderCanCancel,
  assertPurchaseOrderCanRelease,
  assertSupplierCanReceiveOrders,
} from '@/modules/procurement/application/purchase-order-repository';

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `PO-${date}-${suffix}`;
}

function revalidateOrder(orderId: string): void {
  revalidatePath('/purchase-orders');
  revalidatePath(`/purchase-orders/${orderId}`);
}

export async function createPurchaseOrder(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_MANAGE,
  );
  const order = buildPurchaseOrderInsert(formData, generateOrderNumber());
  await assertSupplierCanReceiveOrders(supabase, order.supplier_id);
  const { error } = await supabase.from('purchase_orders').insert(order);
  if (error) throw new Error('No fue posible crear la orden de compra.');
  revalidatePath('/purchase-orders');
  redirect('/purchase-orders');
}

export async function releasePurchaseOrder(orderId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_MANAGE,
  );
  await assertPurchaseOrderCanRelease(supabase, orderId);
  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'released', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle();
  if (error || !data) throw new Error('No fue posible liberar la orden de compra.');
  revalidateOrder(orderId);
}

export async function cancelPurchaseOrder(orderId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_MANAGE,
  );
  await assertPurchaseOrderCanCancel(supabase, orderId);
  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .in('status', ['draft', 'released'])
    .select('id')
    .maybeSingle();
  if (error || !data) throw new Error('No fue posible cancelar la orden de compra.');
  revalidateOrder(orderId);
}
