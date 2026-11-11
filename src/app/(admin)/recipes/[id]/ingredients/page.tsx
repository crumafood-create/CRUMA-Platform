import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { RecipeIngredientsView } from './recipe-ingredients-view';

export default async function RecipeIngredientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const [recipeResult, materialsResult, itemsResult, productsResult, outputRecipesResult, unitsResult] =
    await Promise.all([
      supabase.from('recipes').select('id, name, product_id').eq('id', id).single(),
      supabase
        .from('raw_materials')
        .select('id, name, unit_of_measure_id')
        .is('deleted_at', null)
        .order('name'),
      supabase
        .from('recipe_items')
        .select('id, raw_material_id, product_id, quantity')
        .eq('recipe_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('products')
        .select('id, name, unit_of_measure_id')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('name'),
      supabase
        .from('recipes')
        .select('product_id, unit_of_measure_id')
        .eq('is_active', true),
      supabase
        .from('units_of_measure')
        .select('id, name, code')
        .eq('is_active', true),
    ]);

  if (
    recipeResult.error ||
    materialsResult.error ||
    itemsResult.error ||
    productsResult.error ||
    outputRecipesResult.error ||
    unitsResult.error ||
    !recipeResult.data
  ) {
    throw new Error('No se pudieron cargar los ingredientes de la receta.');
  }

  const unitLabels = new Map(
    (unitsResult.data ?? []).map((unit) => [unit.id, `${unit.code} - ${unit.name}`]),
  );
  const materials = (materialsResult.data ?? []).map((material) => ({
    id: material.id,
    name: material.name,
    unitLabel: material.unit_of_measure_id
      ? unitLabels.get(material.unit_of_measure_id) ?? 'Unidad base no disponible'
      : 'Unidad base sin asignar',
  }));
  const intermediateProducts = (productsResult.data ?? []).flatMap((product) => {
    const unitLabel = product.unit_of_measure_id
      ? unitLabels.get(product.unit_of_measure_id)
      : undefined;
    const hasCompatibleActiveRecipe = (outputRecipesResult.data ?? []).some(
      (recipe) =>
        recipe.product_id === product.id &&
        recipe.unit_of_measure_id === product.unit_of_measure_id,
    );

    if (
      !hasCompatibleActiveRecipe ||
      !unitLabel ||
      product.id === recipeResult.data.product_id
    ) {
      return [];
    }

    return [{ id: product.id, name: product.name, unitLabel }];
  });

  return (
    <RecipeIngredientsView
      recipe={recipeResult.data}
      materials={materials}
      intermediateProducts={intermediateProducts}
      items={itemsResult.data ?? []}
    />
  );
}
