'use server';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export type ReceivingOrderStatus =
  | 'draft'
  | 'pending'
  | 'partial'
  | 'received'
  | 'cancelled';

export type ReceivingOrder = {
  id: string;
  order_number: string;
  supplier_name: string;
  status: ReceivingOrderStatus;
  order_date: string;
  expected_date: string | null;
  total_items: number;
  received_items: number;
};

export async function getReceivingOrders(): Promise<ReceivingOrder[]> {
  const supabase = await createClient();

  const { data: purchaseOrders, error } = await supabase
    .from('purchase_orders')
    .select(`
      id,
      order_number,
      status,
      order_date,
      expected_date,
      suppliers (
        name
      ),
      purchase_order_items (
        id,
        quantity,
        received_quantity
      )
    `)
    .neq('status', 'received')
    .is('deleted_at', null)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (purchaseOrders ?? []).map((order: any) => {
    const items = order.purchase_order_items ?? [];

    const receivedItems = items.filter(
      (item: any) =>
        Number(item.received_quantity ?? 0) >=
        Number(item.quantity ?? 0),
    ).length;

    return {
      id: order.id,

      order_number: order.order_number,

      supplier_name:
        order.suppliers?.name ??
        'Sin proveedor',

      status: order.status,

      order_date: order.order_date,

      expected_date:
        order.expected_date,

      total_items: items.length,

      received_items: receivedItems,
    };
  });
}
