import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

export async function assertFlavorCanBeDeleted(
  supabase: TypedSupabaseClient,
  flavorId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('flavor_id', flavorId)
    .is('deleted_at', null)
    .limit(1);

  if (error) throw new Error(error.message);

  if (data?.length) throw new Error('El sabor tiene productos activos asociados.');
}
