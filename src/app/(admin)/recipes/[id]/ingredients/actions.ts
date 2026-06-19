'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createRecipeItem(
  formData: FormData
) {
  const supabase = await createClient();

  const recipe_id =
    formData.get('recipe_id');

  const ingredient_id =
    formData.get('ingredient_id');

  const quantity =
    Number(
      formData.get('quantity')
    );

  const { error } =
    await supabase
      .from('recipe_items')
      .insert({
        recipe_id,
        ingredient_id,
        quantity,
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    `/recipes/${recipe_id}/ingredients`
  );
}
