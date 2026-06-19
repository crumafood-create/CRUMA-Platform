'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function addRecipeItem(formData: FormData) {
  const supabase = await createClient();

  const recipe_id = formData.get('recipe_id')?.toString().trim() ?? '';
  const ingredient_id = formData.get('ingredient_id')?.toString().trim() ?? '';
  const quantity = Number(formData.get('quantity')) || 0;

  if (!recipe_id || !ingredient_id || quantity <= 0) {
    throw new Error('Receta, materia prima y cantidad son obligatorios');
  }

  const { error } = await supabase.from('recipe_items').insert({
    recipe_id,
    ingredient_id,
    quantity,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/recipes/${recipe_id}/ingredients`);
  revalidatePath('/recipes');

  redirect(`/recipes/${recipe_id}/ingredients`);
}
