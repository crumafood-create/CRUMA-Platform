import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

export async function assertUnitOfMeasureCodeAvailable(
  supabase: TypedSupabaseClient,
  code: string,
  excludedId?: string,
): Promise<void> {
  let query = supabase.from('units_of_measure').select('id').eq('code', code);

  if (excludedId) query = query.neq('id', excludedId);

  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(error.message);

  if (data) throw new Error('Ya existe una unidad con ese código.');
}

export async function assertUnitOfMeasureCanBeDeleted(
  supabase: TypedSupabaseClient,
  unitId: string,
): Promise<void> {
  const [products, materials, recipes] = await Promise.all([
    supabase
      .from('products')
      .select('id')
      .eq('unit_of_measure_id', unitId)
      .is('deleted_at', null)
      .limit(1),
    supabase
      .from('raw_materials')
      .select('id')
      .eq('unit_of_measure_id', unitId)
      .is('deleted_at', null)
      .limit(1),
    supabase
      .from('recipes')
      .select('id')
      .eq('unit_of_measure_id', unitId)
      .eq('is_active', true)
      .limit(1),
  ]);

  for (const result of [products, materials, recipes]) {
    if (result.error) throw new Error(result.error.message);

    if (result.data?.length) {
      throw new Error(
        'La unidad está asociada con productos, materias primas o recetas activas.',
      );
    }
  }
}
