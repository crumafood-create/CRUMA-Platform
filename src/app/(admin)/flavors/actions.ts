'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import {
  buildFlavorInsert,
  buildFlavorUpdate,
} from '@/modules/inventory/application/flavor-catalog-contract';
import { assertFlavorCanBeDeleted } from '@/modules/inventory/application/flavor-catalog-repository';

export async function createFlavor(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );

  const { error } = await supabase
    .from('flavors')
    .insert(buildFlavorInsert(formData));

  if (error) throw new Error(error.message);

  revalidatePath('/flavors');
  revalidatePath('/products');
  redirect('/flavors');
}

export async function updateFlavor(flavorId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );

  const { error } = await supabase
    .from('flavors')
    .update(buildFlavorUpdate(formData, new Date().toISOString()))
    .eq('id', flavorId);

  if (error) throw new Error(error.message);

  revalidatePath('/flavors');
  revalidatePath('/products');
  redirect('/flavors');
}

export async function deleteFlavor(flavorId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );

  await assertFlavorCanBeDeleted(supabase, flavorId);

  const { error } = await supabase
    .from('flavors')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', flavorId);

  if (error) throw new Error(error.message);

  revalidatePath('/flavors');
  revalidatePath('/products');
  redirect('/flavors');
}
