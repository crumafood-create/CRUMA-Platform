import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { RecipeIngredientsView } from './recipe-ingredients-view';

export default async function RecipeIngredientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const [recipeResult, materialsResult, itemsResult] = await Promise.all([
    supabase.from('recipes').select('id, name').eq('id', id).single(),
    supabase
      .from('raw_materials')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('recipe_items')
      .select('id, raw_material_id, quantity')
      .eq('recipe_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (
    recipeResult.error ||
    materialsResult.error ||
    itemsResult.error ||
    !recipeResult.data
  ) {
    throw new Error('No se pudieron cargar los ingredientes de la receta.');
  }

  return (
    <RecipeIngredientsView
      recipe={recipeResult.data}
      materials={materialsResult.data ?? []}
      items={itemsResult.data ?? []}
    />
  );
}
