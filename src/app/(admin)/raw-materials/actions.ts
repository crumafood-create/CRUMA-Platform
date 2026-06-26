'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createRawMaterial(
  formData: FormData
) {
  const supabase = await createClient();

  const payload = {
    name: formData.get('name')?.toString() ?? null,
    slug: formData.get('slug')?.toString() ?? null,
    internal_code:
      formData.get('internal_code')?.toString() ?? null,

    category_id:
      formData.get('category_id')?.toString() || null,

    family_id:
      formData.get('family_id')?.toString() || null,

    unit_of_measure_id:
      formData.get('unit_of_measure_id')?.toString() ||
      null,

    current_stock:
      Number(formData.get('current_stock')) || 0,

    minimum_stock:
      Number(formData.get('minimum_stock')) || 0,

    average_cost:
      Number(formData.get('average_cost')) || 0,

    last_cost:
      Number(formData.get('last_cost')) || 0,

    description:
      formData.get('description')?.toString() ?? null,

    is_active:
      formData.get('is_active') === 'true',
  };

  const result = await supabase
    .from('raw_materials')
    .insert(payload)
    .select();

  if (result.error) {
    throw new Error(JSON.stringify(result.error));
  }

  revalidatePath('/raw-materials');
  redirect('/raw-materials');
}

export async function updateRawMaterial(
  materialId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const payload = {
    name: formData.get('name')?.toString() ?? null,
    slug: formData.get('slug')?.toString() ?? null,
    internal_code:
      formData.get('internal_code')?.toString() ?? null,

    category_id:
      formData.get('category_id')?.toString() || null,

    family_id:
      formData.get('family_id')?.toString() || null,

    unit_of_measure_id:
      formData.get('unit_of_measure_id')?.toString() ||
      null,

    current_stock:
      Number(formData.get('current_stock')) || 0,

    minimum_stock:
      Number(formData.get('minimum_stock')) || 0,

    average_cost:
      Number(formData.get('average_cost')) || 0,

    last_cost:
      Number(formData.get('last_cost')) || 0,

    description:
      formData.get('description')?.toString() ?? null,

    is_active:
      formData.get('is_active') === 'true',

    updated_at: new Date().toISOString(),
  };

  const result = await supabase
    .from('raw_materials')
    .update(payload)
    .eq('id', materialId)
    .select();

  if (result.error) {
    throw new Error(JSON.stringify(result.error));
  }

  revalidatePath('/raw-materials');
  redirect('/raw-materials');
}

export async function deleteRawMaterial(
  materialId: string
) {
  const supabase = await createClient();

  const result = await supabase
    .from('raw_materials')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', materialId)
    .select();

  if (result.error) {
    throw new Error(JSON.stringify(result.error));
  }

  revalidatePath('/raw-materials');
  redirect('/raw-materials');
}
