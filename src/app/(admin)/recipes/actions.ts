'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  buildRecipeInsert,
  buildRecipeUpdate,
} from '@/modules/production/application/recipe-contract';
import { assertRecipeReferencesAvailable } from '@/modules/production/application/recipe-repository';

export async function createRecipe(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_RECIPE_MANAGE,
  );
  const recipe = buildRecipeInsert(formData);

  await assertRecipeReferencesAvailable(
    supabase,
    recipe.product_id,
    recipe.unit_of_measure_id,
  );

  const { error } = await supabase.from('recipes').insert(recipe);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/recipes');
  redirect('/recipes');
}

export async function updateRecipe(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PRODUCTION_RECIPE_MANAGE,
  );
  const recipeId = formData.get('recipe_id')?.toString().trim() ?? '';
  if (!recipeId) throw new Error('El campo recipe_id es obligatorio.');

  const recipe = buildRecipeUpdate(formData, new Date().toISOString());
  const { data: existing, error: lookupError } = await supabase
    .from('recipes')
    .select('id, product_id, unit_of_measure_id')
    .eq('id', recipeId)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!existing) throw new Error('La receta no existe.');
  if (!existing.product_id || !existing.unit_of_measure_id) {
    throw new Error('La receta debe tener producto de salida y unidad para editarse.');
  }
  await assertRecipeReferencesAvailable(
    supabase,
    existing.product_id,
    existing.unit_of_measure_id,
  );

  const { data: updated, error } = await supabase
    .from('recipes')
    .update(recipe)
    .eq('id', recipeId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!updated) throw new Error('La receta no se pudo actualizar.');

  revalidatePath('/recipes');
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/recipes/${recipeId}/ingredients`);
  redirect(`/recipes/${recipeId}`);
}
