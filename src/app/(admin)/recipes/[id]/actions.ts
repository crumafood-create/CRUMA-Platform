'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createRecipeItem(
  formData: FormData
) {
  const supabase = await createClient();

  const recipeId =
    String(formData.get('recipe_id'));

  const ingredientId =
    String(formData.get('ingredient_id'));

  const quantity =
    Number(formData.get('quantity'));

  const { error } = await supabase
    .from('recipe_items')
    .insert({
      recipe_id: recipeId,
      ingredient_id: ingredientId,
      quantity,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/recipes/${recipeId}`);
}
