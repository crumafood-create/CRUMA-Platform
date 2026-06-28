'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createRecipeItem(formData: FormData) {
  const supabase = await createClient();

  const recipeId = formData.get('recipe_id')?.toString() ?? '';
  const ingredientId = formData.get('ingredient_id')?.toString() ?? '';
  const quantity = Number(formData.get('quantity'));

  if (!recipeId || !ingredientId || !quantity) {
    throw new Error('Datos incompletos');
  }

  const { error } = await supabase.from('recipe_items').insert({
    recipe_id: recipeId,
    ingredient_id: ingredientId,
    quantity,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/recipes/${recipeId}/ingredients`);
}
