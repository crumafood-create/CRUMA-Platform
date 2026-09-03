import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import { assertSalesOrderStatus } from './sales-order-contract';

async function assertDraftOrder(
  supabase: TypedSupabaseClient,
  orderId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('sales_orders').select('id, status').eq('id', orderId).maybeSingle();
  if (error) throw new Error('No fue posible validar la orden de venta.');
  if (!data) throw new Error('Orden de venta no encontrada.');
  if (assertSalesOrderStatus(data.status) !== 'draft') {
    throw new Error('Solo se pueden modificar órdenes en borrador.');
  }
}

export async function assertCustomerCanOrder(
  supabase: TypedSupabaseClient,
  customerId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('customers').select('id').eq('id', customerId)
    .eq('is_active', true).is('deleted_at', null).maybeSingle();
  if (error) throw new Error('No fue posible validar el cliente.');
  if (!data) throw new Error('El cliente no está disponible para nuevas órdenes.');
}

export async function assertSalesOrderItemCanBeAdded(
  supabase: TypedSupabaseClient,
  orderId: string,
  productId: string,
): Promise<void> {
  await assertDraftOrder(supabase, orderId);
  const { data: product, error: productError } = await supabase
    .from('products').select('id').eq('id', productId)
    .eq('status', 'active').is('deleted_at', null).maybeSingle();
  if (productError) throw new Error('No fue posible validar el producto.');
  if (!product) throw new Error('El producto no está disponible.');
  const { data: duplicate, error } = await supabase
    .from('sales_order_items').select('id')
    .eq('sales_order_id', orderId).eq('product_id', productId).maybeSingle();
  if (error) throw new Error('No fue posible validar los renglones de venta.');
  if (duplicate) throw new Error('El producto ya está incluido en la orden.');
}
