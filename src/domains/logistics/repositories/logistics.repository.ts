import { createClient }
from '@/infrastructure/supabase/server';

import { deliveryDto }
from '../dto/delivery.dto';

export async function getDeliveries() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('deliveries')

      .select(`
        id,
        order_id,
        status,
        driver_name,
        tracking_code,
        created_at
      `)

      .order('created_at', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(
    deliveryDto
  );
}
