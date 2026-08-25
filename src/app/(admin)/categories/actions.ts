'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import {
  buildCategoryInsert,
  buildCategoryUpdate,
} from '@/modules/inventory/application/category-family-contract';
import { assertCategoryCanBeDeleted } from '@/modules/inventory/application/category-family-repository';

export async function createCategory(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );
  const { error } = await supabase
    .from('categories')
    .insert(buildCategoryInsert(formData));

  if (error) throw new Error(error.message);

  revalidatePath('/categories');
  redirect('/categories');
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );

  const { error } = await supabase
    .from('categories')
    .update(buildCategoryUpdate(formData, new Date().toISOString()))
    .eq('id', categoryId);

  if (error) throw new Error(error.message);

  revalidatePath('/categories');
  revalidatePath('/families');
  revalidatePath('/products');
  revalidatePath('/raw-materials');
  redirect('/categories');
}

export async function deleteCategory(categoryId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );

  await assertCategoryCanBeDeleted(supabase, categoryId);

  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', categoryId);

  if (error) throw new Error(error.message);

  revalidatePath('/categories');
  redirect('/categories');
}
