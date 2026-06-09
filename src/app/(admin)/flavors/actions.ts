'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createFlavor(
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('flavors')
    .insert({
      family_id: formData.get('family_id'),
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      is_active:
        formData.get('is_active') === 'true',
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/flavors');

  redirect('/flavors');
}

export async function updateFlavor(
  flavorId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('flavors')
    .update({
      family_id: formData.get('family_id'),
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      is_active:
        formData.get('is_active') === 'true',
      updated_at: new Date(),
    })
    .eq('id', flavorId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/flavors');

  redirect('/flavors');
}

export async function deleteFlavor(
  flavorId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('flavors')
    .update({
      deleted_at: new Date(),
    })
    .eq('id', flavorId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/flavors');

  redirect('/flavors');
}
