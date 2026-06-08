'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createCategory(
  formData: FormData
) {
  const supabase = await createClient();

  const { error } =
    await supabase
      .from('categories')
      .insert({
        name: formData.get('name'),
        slug: formData.get('slug'),
        description:
          formData.get('description'),
        status:
          formData.get('status'),
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/categories');

  redirect('/categories');
}
