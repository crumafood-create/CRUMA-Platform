'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createRecipeItem(
  recipeId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } =
    await supabase
      .from('recipe_items')
      .insert({
        recipe_id: recipeId,
        ingredient_id:
          formData.get('ingredient_id'),
        quantity:
          Number(
            formData.get('quantity')
          ),
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    `/recipes/${recipeId}`
  );

  redirect(
    `/recipes/${recipeId}`
  );
}
