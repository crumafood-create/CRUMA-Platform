'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import {
  buildFamilyInsert,
  buildFamilyUpdate,
} from '@/modules/inventory/application/category-family-contract';
import {
  assertCategoryExists,
  assertFamilyCanBeDeleted,
} from '@/modules/inventory/application/category-family-repository';

export async function createFamily(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );
  const family = buildFamilyInsert(formData);

  await assertCategoryExists(supabase, family.category_id);

  const { error } = await supabase.from('families').insert(family);

  if (error) throw new Error(error.message);

  revalidatePath('/families');
  redirect('/families');
}

export async function updateFamily(familyId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );
  const family = buildFamilyUpdate(formData, new Date().toISOString());

  await assertCategoryExists(supabase, family.category_id);

  const { error } = await supabase
    .from('families')
    .update(family)
    .eq('id', familyId);

  if (error) throw new Error(error.message);

  revalidatePath('/families');
  revalidatePath('/raw-materials');
  redirect('/families');
}

export async function deleteFamily(familyId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );

  await assertFamilyCanBeDeleted(supabase, familyId);

  const { error } = await supabase
    .from('families')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', familyId);

  if (error) throw new Error(error.message);

  revalidatePath('/families');
  redirect('/families');
}
