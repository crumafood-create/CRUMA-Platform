'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createFamily(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from('families').insert({
    category_id:   formData.get('category_id') || null,
    name:          formData.get('name'),
    slug:          formData.get('slug'),
    internal_code: formData.get('internal_code') || null,
    description:   formData.get('description') || null,
    is_active:     formData.get('is_active') === 'true',
  });

  if (error) throw new Error(error.message);

  revalidatePath('/families');
  redirect('/families');
}

export async function updateFamily(familyId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('families')
    .update({
      category_id:   formData.get('category_id') || null,
      name:          formData.get('name'),
      slug:          formData.get('slug'),
      internal_code: formData.get('internal_code') || null,
      description:   formData.get('description') || null,
      is_active:     formData.get('is_active') === 'true',
      updated_at:    new Date().toISOString(),
    })
    .eq('id', familyId);

  if (error) throw new Error(error.message);

  revalidatePath('/families');
  redirect('/families');
}

export async function deleteFamily(familyId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('families')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', familyId);

  if (error) throw new Error(error.message);

  revalidatePath('/families');
  redirect('/families');
}
