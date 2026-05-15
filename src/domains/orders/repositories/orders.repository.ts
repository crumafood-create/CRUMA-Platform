import { createClient }
from '@/infrastructure/supabase/server';

import { orderDto }
from '../dto/order.dto';

export async function getOrders() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('orders')

      .select(`
        id,
        status,
        payment_status,
        total_amount,
        created_at,
        full_name,
        phone
      `)

      .order('created_at', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(orderDto);
}

export async function getOrderById(
  id: string
) {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('orders')

      .select(`
        id,
        status,
        payment_status,
        total_amount,
        created_at,
        full_name,
        phone
      `)

      .eq('id', id)

      .single();

  if (error) {
    throw error;
  }

  return orderDto(data);
}
