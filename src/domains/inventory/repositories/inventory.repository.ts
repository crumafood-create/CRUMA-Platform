import 'server-only';

import { createClient }
from '@/infrastructure/supabase/server';

import { inventoryLevelDto }
from '../dto/inventory-level.dto';

export async function getInventoryLevels() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('inventory_levels')

      .select(`
        id,
        product_id,
        warehouse_id,
        available_quantity,
        reserved_quantity,
        updated_at
      `)

      .order('updated_at', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(
    inventoryLevelDto
  );
}
