'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import {
  buildRawMaterialInsert,
  buildRawMaterialUpdate,
} from '@/modules/inventory/application/raw-material-contract';

export async function createRawMaterial(formData: FormData) {
  const supabase = await createTypedClient();
  const { error } = await supabase
    .from('raw_materials')
    .insert(buildRawMaterialInsert(formData));

  if (error) throw new Error(error.message);

  revalidatePath('/raw-materials');
  redirect('/raw-materials');
}

export async function updateRawMaterial(materialId: string, formData: FormData) {
  const supabase = await createTypedClient();
  const { error } = await supabase
    .from('raw_materials')
    .update(buildRawMaterialUpdate(formData, new Date().toISOString()))
    .eq('id', materialId);

  if (error) throw new Error(error.message);

  revalidatePath('/raw-materials');
  revalidatePath('/inventory/alerts');
  redirect('/raw-materials');
}

export async function deleteRawMaterial(materialId: string) {
  const supabase = await createTypedClient();
  const { error } = await supabase
    .from('raw_materials')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', materialId);

  if (error) throw new Error(error.message);

  revalidatePath('/raw-materials');
  revalidatePath('/inventory/alerts');
  redirect('/raw-materials');
}
