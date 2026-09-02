import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

export const WAREHOUSE_REFERENCE_TABLES = [
  'deliveries',
  'delivery_routes',
  'inventory_batches',
  'inventory_levels',
  'inventory_movements',
  'inventory_snapshots_daily',
  'production_orders',
  'stock_reservations',
  'waste_tracking',
] as const;

export async function assertWarehouseCodeAvailable(
  supabase: TypedSupabaseClient,
  code: string,
  excludedId?: string,
): Promise<void> {
  let query = supabase.from('warehouses').select('id').ilike('code', code).limit(1);

  if (excludedId) query = query.neq('id', excludedId);

  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(error.message);
  if (data) throw new Error('Ya existe un almacén con ese código.');
}

function warehouseReferenceQueries(
  supabase: TypedSupabaseClient,
  warehouseId: string,
) {
  return [
    supabase.from('deliveries').select('id').eq('warehouse_id', warehouseId).limit(1),
    supabase.from('delivery_routes').select('id').eq('warehouse_id', warehouseId).limit(1),
    supabase.from('inventory_batches').select('id').eq('warehouse_id', warehouseId).limit(1),
    supabase.from('inventory_levels').select('id').eq('warehouse_id', warehouseId).limit(1),
    supabase.from('inventory_movements').select('id').eq('warehouse_id', warehouseId).limit(1),
    supabase
      .from('inventory_snapshots_daily')
      .select('id')
      .eq('warehouse_id', warehouseId)
      .limit(1),
    supabase.from('production_orders').select('id').eq('warehouse_id', warehouseId).limit(1),
    supabase.from('stock_reservations').select('id').eq('warehouse_id', warehouseId).limit(1),
    supabase.from('waste_tracking').select('id').eq('warehouse_id', warehouseId).limit(1),
  ];
}

export async function assertWarehouseCanBeDeleted(
  supabase: TypedSupabaseClient,
  warehouseId: string,
): Promise<void> {
  const results = await Promise.all(warehouseReferenceQueries(supabase, warehouseId));

  for (const result of results) {
    if (result.error) throw new Error(result.error.message);

    if (result.data?.length) {
      throw new Error('El almacén tiene operaciones o existencias asociadas.');
    }
  }
}
