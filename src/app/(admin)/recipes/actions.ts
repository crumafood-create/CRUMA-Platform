'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createRecipe(
  formData: FormData
) {
  const supabase = await createClient();

  const { error } =
    await supabase
      .from('recipes')
      .insert({
        name: formData.get('name'),
        slug: formData.get('slug'),
        internal_code:
          formData.get('internal_code'),

        description:
          formData.get('description'),

        yield_quantity:
          Number(
            formData.get('yield_quantity')
          ) || 1,

        unit_of_measure_id:
          formData.get(
            'unit_of_measure_id'
          ) || null,

        is_active:
          formData.get('is_active') ===
          'true',
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/recipes');

  redirect('/recipes');
}
