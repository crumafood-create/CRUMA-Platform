import { createClient }
from '@/infrastructure/supabase/server';

import { productionOrderDto }
from '../dto/production-order.dto';

export async function getProductionOrders() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('production_orders')

      .select(`
        id,
        order_number,
        status,
        planned_quantity,
        produced_quantity,
        created_at
      `)

      .order('created_at', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(
    productionOrderDto
  );
}
