'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createCategory(
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
  .from('categories')
  .insert({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    is_active: true,
  });

  if (error) {
  console.error('CATEGORY ERROR:', error);

  throw new Error(
    JSON.stringify(error, null, 2)
  );
  }

  revalidatePath('/categories');

  redirect('/categories');
}

export async function updateCategory(
  categoryId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
  .from('categories')
  .update({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    is_active: formData.get('is_active') === 'true',
    updated_at: new Date().toISOString(),
  })
    .eq('id', categoryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/categories');

  redirect('/categories');
}

export async function deleteCategory(
  categoryId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('categories')
    .update({
      deleted_at: new Date(),
    })
    .eq('id', categoryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/categories');

  redirect('/categories');
}

