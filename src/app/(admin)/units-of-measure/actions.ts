'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createUnitOfMeasure(
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('units_of_measure')
    .insert({
      name: formData.get('name'),
      code: formData.get('code'),
      is_active:
        formData.get('is_active') === 'true',
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/units-of-measure');

  redirect('/units-of-measure');
}

export async function updateUnitOfMeasure(
  unitId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('units_of_measure')
    .update({
      name: formData.get('name'),
      code: formData.get('code'),
      is_active:
        formData.get('is_active') === 'true',
      updated_at:
        new Date().toISOString(),
    })
    .eq('id', unitId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/units-of-measure');

  redirect('/units-of-measure');
}

export async function deleteUnitOfMeasure(
  unitId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('units_of_measure')
    .delete()
    .eq('id', unitId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/units-of-measure');

  redirect('/units-of-measure');
}
