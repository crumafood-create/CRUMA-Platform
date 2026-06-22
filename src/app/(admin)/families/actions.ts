'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createFamily(formData: FormData) {
  const supabase = await createClient();

  const categoryId = formData.get('category_id')?.toString();
  const name = formData.get('name')?.toString();
  const slug = formData.get('slug')?.toString();
  const internalCode = formData.get('internal_code')?.toString();
  const description = formData.get('description')?.toString();
  const isActive = formData.get('is_active')?.toString() === 'true';

  if (!categoryId || !name || !slug || !internalCode) {
    throw new Error('Datos incompletos');
  }

  const { error } = await supabase.from('families').insert({
    category_id: categoryId,
    name,
    slug,
    internal_code: internalCode,
    description,
    is_active: isActive,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/families');
  redirect('/families');
}

export async function updateFamily(familyId: string, formData: FormData) {
  const supabase = await createClient();

  const categoryId = formData.get('category_id')?.toString();
  const name = formData.get('name')?.toString();
  const slug = formData.get('slug')?.toString();
  const internalCode = formData.get('internal_code')?.toString();
  const description = formData.get('description')?.toString();
  const isActive = formData.get('is_active')?.toString() === 'true';

  if (!categoryId || !name || !slug || !internalCode) {
    throw new Error('Datos incompletos');
  }

  const { error } = await supabase
    .from('families')
    .update({
      category_id: categoryId,
      name,
      slug,
      internal_code: internalCode,
      description,
      is_active: isActive,
      updated_at: new Date().toISOString(),
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
