'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createWarehouse(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('warehouses')
    .insert({
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      is_active: formData.get('is_active') === 'true',
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/warehouses');
  redirect('/warehouses');
}

export async function updateWarehouse(
  warehouseId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('warehouses')
    .update({
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      is_active: formData.get('is_active') === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', warehouseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/warehouses');
  redirect('/warehouses');
}

export async function deleteWarehouse(warehouseId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('warehouses')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', warehouseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/warehouses');
  redirect('/warehouses');
}
