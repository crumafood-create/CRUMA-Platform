import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

type QueryResult<T extends { id: string }> = {
  data: T | null;
  error: { message: string } | null;
};

function requireAvailable<T extends { id: string }>(
  result: QueryResult<T>,
  unavailableMessage: string,
): T {
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error(unavailableMessage);

  return result.data;
}

export async function assertRecipeReferencesAvailable(
  supabase: TypedSupabaseClient,
  productId: string,
  unitId: string,
): Promise<void> {
  const [productResult, unitResult] = await Promise.all([
    supabase
      .from('products')
      .select('id, unit_of_measure_id')
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

  const product = requireAvailable(productResult, 'El producto no existe o no está activo.');
  requireAvailable(unitResult, 'La unidad no existe o no está activa.');

  if (product.unit_of_measure_id !== unitId) {
    throw new Error('La unidad de rendimiento debe coincidir con la unidad base del producto.');
  }
}

export type RecipeIngredientReference = {
  rawMaterialId: string | null;
  productId: string | null;
};

export async function assertRecipeItemReferencesAvailable(
  supabase: TypedSupabaseClient,
  recipeId: string,
  ingredient: RecipeIngredientReference,
  excludeItemId?: string,
): Promise<void> {
  const recipeResult = await supabase
    .from('recipes')
    .select('id, product_id')
    .eq('id', recipeId)
    .eq('is_active', true)
    .maybeSingle();

  const recipe = requireAvailable(recipeResult, 'La receta no existe o no está activa.');

  if (ingredient.productId && recipe.product_id === ingredient.productId) {
    throw new Error('Una receta no puede usar su propio producto de salida como ingrediente.');
  }

  const { data: currentItems, error: currentItemsError } = await supabase
    .from('recipe_items')
    .select('*')
    .eq('recipe_id', recipeId);

  if (currentItemsError) throw new Error(currentItemsError.message);

  const currentIngredients = ((currentItems ?? []) as unknown as Array<{
    id: string;
    raw_material_id: string | null;
    product_id?: string | null;
  }>).filter((item) => !excludeItemId || item.id !== excludeItemId);

  if (ingredient.rawMaterialId) {
    const materialResult = await supabase
      .from('raw_materials')
      .select('id')
      .eq('id', ingredient.rawMaterialId)
      .is('deleted_at', null)
      .maybeSingle();

    requireAvailable(materialResult, 'La materia prima no existe o fue eliminada.');

    if (currentIngredients.some((item) => item.raw_material_id === ingredient.rawMaterialId)) {
      throw new Error('La materia prima ya pertenece a esta receta.');
    }

    return;
  }

  const productResult = await supabase
    .from('products')
    .select('id, unit_of_measure_id')
    .eq('id', ingredient.productId!)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();

  const product = requireAvailable(productResult, 'El producto intermedio no existe o no está activo.');
  if (!product.unit_of_measure_id) {
    throw new Error('El producto intermedio no tiene unidad base.');
  }

  const sourceRecipeResult = await supabase
    .from('recipes')
    .select('id, unit_of_measure_id')
    .eq('product_id', ingredient.productId!)
    .eq('is_active', true)
    .eq('unit_of_measure_id', product.unit_of_measure_id)
    .limit(1)
    .maybeSingle();

  requireAvailable(sourceRecipeResult, 'El producto no tiene una receta intermedia activa.');

  if (currentIngredients.some((item) => item.product_id)) {
    throw new Error('Cada receta puede usar una sola variedad de masa.');
  }
}
