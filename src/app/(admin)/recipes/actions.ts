'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { buildRecipeInsert } from '@/modules/production/application/recipe-contract';
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
