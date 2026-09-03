'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { buildSalesOrderItemInsert } from '@/modules/sales/application/sales-order-contract';
import { assertSalesOrderItemCanBeAdded } from '@/modules/sales/application/sales-order-repository';

export async function createSalesOrderItem(formData: FormData): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_ORDER_CREATE);
  const insert = buildSalesOrderItemInsert(formData);
  await assertSalesOrderItemCanBeAdded(supabase, insert.sales_order_id, insert.product_id);
  const { error } = await supabase.rpc('add_sales_order_item', {
    p_order_id: insert.sales_order_id,
    p_product_id: insert.product_id,
    p_quantity: insert.quantity,
    p_unit_price: insert.unit_price,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sales-orders/${insert.sales_order_id}`);
  revalidatePath(`/sales-orders/${insert.sales_order_id}/items`);
  revalidatePath('/sales-orders');
}
