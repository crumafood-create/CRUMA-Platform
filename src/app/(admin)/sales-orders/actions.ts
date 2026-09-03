'use server';

import crypto from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { buildSalesOrderInsert } from '@/modules/sales/application/sales-order-contract';
import { assertCustomerCanOrder } from '@/modules/sales/application/sales-order-repository';

function generateOrderNumber(): string {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `SO-${day}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function refreshOrder(orderId: string): void {
  revalidatePath('/sales-orders');
  revalidatePath(`/sales-orders/${orderId}`);
}

export async function createSalesOrder(formData: FormData): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_ORDER_CREATE);
  const insert = buildSalesOrderInsert(formData, generateOrderNumber());
  await assertCustomerCanOrder(supabase, insert.customer_id);
  const { error } = await supabase.from('sales_orders').insert(insert);
  if (error) throw new Error('No fue posible crear la orden de venta.');
  revalidatePath('/sales-orders');
  redirect('/sales-orders');
}

export async function confirmSalesOrder(orderId: string): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_ORDER_CONFIRM);
  const { data: pickingId, error } = await supabase.rpc('confirm_sales_order', {
    p_order_id: orderId,
  });
  if (error || !pickingId) throw new Error(error?.message ?? 'No fue posible confirmar el pedido.');
  refreshOrder(orderId);
  revalidatePath('/inventory-atp');
  revalidatePath('/mobile/picking');
  revalidatePath(`/mobile/picking/${pickingId}`);
}

export async function startPreparingSalesOrder(orderId: string): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_ORDER_PREPARE);
  const { error } = await supabase.rpc('transition_sales_order', {
    p_order_id: orderId, p_expected_status: 'confirmed', p_next_status: 'preparing',
  });
  if (error) throw new Error(error.message);
  refreshOrder(orderId);
}

export async function markSalesOrderReady(orderId: string): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_ORDER_PREPARE);
  const { error } = await supabase.rpc('transition_sales_order', {
    p_order_id: orderId, p_expected_status: 'preparing', p_next_status: 'ready',
  });
  if (error) throw new Error(error.message);
  refreshOrder(orderId);
}

export async function deliverSalesOrder(orderId: string): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_ORDER_DELIVER);
  const { error } = await supabase.rpc('deliver_sales_order', { p_order_id: orderId });
  if (error) throw new Error(error.message);
  refreshOrder(orderId);
  revalidatePath('/inventory-stock');
  revalidatePath('/inventory-atp');
  revalidatePath('/accounts-receivable');
}
