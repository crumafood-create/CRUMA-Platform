'use server';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { assertPurchaseOrderStatus, type PurchaseOrderStatus } from '@/modules/procurement/application/purchase-order-contract';

export type ReceivingOrder = {
  id: string;
  order_number: string;
  supplier_name: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date: string | null;
  total_items: number;
  received_items: number;
};

export async function getReceivingOrders(): Promise<ReceivingOrder[]> {
  const supabase = await createTypedClient();
  const { data: orders, error } = await supabase
    .from('purchase_orders')
    .select('id, order_number, supplier_id, status, order_date, expected_date')
    .in('status', ['released', 'partially_received'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error('No fue posible cargar las recepciones.');

  const orderIds = (orders ?? []).map((order) => order.id);
  const supplierIds = (orders ?? []).map((order) => order.supplier_id);
  const [{ data: suppliers }, { data: items }] = await Promise.all([
    supplierIds.length
      ? supabase.from('suppliers').select('id, name').in('id', supplierIds)
      : Promise.resolve({ data: [], error: null }),
    orderIds.length
      ? supabase.from('purchase_order_items').select('purchase_order_id, quantity, received_quantity').in('purchase_order_id', orderIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const supplierNames = new Map((suppliers ?? []).map((row) => [row.id, row.name]));

  return (orders ?? []).map((order) => {
    const orderItems = (items ?? []).filter((item) => item.purchase_order_id === order.id);
    return {
      ...order,
      status: assertPurchaseOrderStatus(order.status),
      supplier_name: supplierNames.get(order.supplier_id) ?? 'Sin proveedor',
      total_items: orderItems.length,
      received_items: orderItems.filter((item) => item.received_quantity >= item.quantity).length,
    };
  });
}
