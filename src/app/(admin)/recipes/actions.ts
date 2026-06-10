'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createRecipe(
  formData: FormData
) {
  const supabase = await createClient();

  const productId =
    formData.get('product_id');

  const notes =
    formData.get('notes');

  const { error } =
    await supabase
      .from('recipes')
      .insert({
        product_id: productId,
        notes,
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/recipes');

  redirect('/recipes');
}
