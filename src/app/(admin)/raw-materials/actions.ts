'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createRawMaterial(
  formData: FormData
) {
  const supabase = await createClient();

  const payload = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    internal_code: formData.get('internal_code'),

    category_id:
      formData.get('category_id') || null,

    family_id:
      formData.get('family_id') || null,

    unit_of_measure_id:
      formData.get('unit_of_measure_id') || null,

    current_stock:
      Number(formData.get('current_stock')) || 0,

    minimum_stock:
      Number(formData.get('minimum_stock')) || 0,

    average_cost:
      Number(formData.get('average_cost')) || 0,

    last_cost:
      Number(formData.get('last_cost')) || 0,

    description:
      formData.get('description'),

    is_active:
      formData.get('is_active') === 'true',
  };

  console.log('RAW MATERIAL PAYLOAD', payload);

  const result = await supabase
    .from('raw_materials')
    .insert(payload)
    .select();

  console.log(
    'RAW MATERIAL RESULT',
    JSON.stringify(result, null, 2)
  );

  if (result.error) {
    throw new Error(
      JSON.stringify(result.error)
    );
  }

  revalidatePath('/raw-materials');
  redirect('/raw-materials');
}
