import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

type QueryResult = {
  data: { id: string } | null;
  error: { message: string } | null;
};

function requireAvailable(result: QueryResult, unavailableMessage: string): void {
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error(unavailableMessage);
}

export async function assertRecipeReferencesAvailable(
  supabase: TypedSupabaseClient,
  productId: string,
  unitId: string,
): Promise<void> {
  const [product, unit] = await Promise.all([
    supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle(),
    supabase
      .from('units_of_measure')
      .select('id')
      .eq('id', unitId)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  requireAvailable(product, 'El producto no existe o no está activo.');
  requireAvailable(unit, 'La unidad no existe o no está activa.');
}

export async function assertRecipeItemReferencesAvailable(
  supabase: TypedSupabaseClient,
  recipeId: string,
  materialId: string,
): Promise<void> {
  const [recipe, material, duplicate] = await Promise.all([
    supabase.from('recipes').select('id').eq('id', recipeId).eq('is_active', true).maybeSingle(),
    supabase
      .from('raw_materials')
      .select('id')
      .eq('id', materialId)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase
      .from('recipe_items')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('raw_material_id', materialId)
      .maybeSingle(),
  ]);

  requireAvailable(recipe, 'La receta no existe o no está activa.');
  requireAvailable(material, 'La materia prima no existe o fue eliminada.');
  if (duplicate.error) throw new Error(duplicate.error.message);
  if (duplicate.data) throw new Error('La materia prima ya pertenece a esta receta.');
}
