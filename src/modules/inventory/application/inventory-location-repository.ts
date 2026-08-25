import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

export async function assertInventoryLocationSlugAvailable(
  supabase: TypedSupabaseClient,
  slug: string,
  excludedId?: string,
): Promise<void> {
  let query = supabase
    .from('inventory_locations')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null);

  if (excludedId) query = query.neq('id', excludedId);

  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(error.message);

  if (data) throw new Error('Ya existe una ubicación activa con ese código.');
}

export async function assertInventoryLocationCanBeDeleted(
  supabase: TypedSupabaseClient,
  locationId: string,
): Promise<void> {
  const [productLots, materialLots, pickingItems] = await Promise.all([
    supabase
      .from('product_lots')
      .select('id')
      .eq('inventory_location_id', locationId)
      .limit(1),
    supabase
      .from('raw_material_lots')
      .select('id')
      .eq('inventory_location_id', locationId)
      .limit(1),
    supabase
      .from('picking_order_items')
      .select('id')
      .eq('inventory_location_id', locationId)
      .limit(1),
  ]);

  for (const result of [productLots, materialLots, pickingItems]) {
    if (result.error) throw new Error(result.error.message);

    if (result.data?.length) {
      throw new Error('La ubicación tiene lotes o referencias de picking asociadas.');
    }
  }
}
