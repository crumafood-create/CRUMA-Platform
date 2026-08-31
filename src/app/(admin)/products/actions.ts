'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import {
  buildProductInsert,
  buildProductUpdate,
} from '@/modules/inventory/application/product-catalog-contract';
import {
  assertPreparationTypeExists,
  assertProductFamilyBelongsToCategory,
} from '@/modules/inventory/application/product-catalog-repository';

export async function updateProduct(productId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );
  const product = buildProductUpdate(formData, new Date().toISOString());

  await assertProductFamilyBelongsToCategory(
    supabase,
    product.category_id ?? null,
    product.family_id ?? null,
  );
  await assertPreparationTypeExists(
    supabase,
    product.preparation_type_id ?? null,
  );

  const { error } = await supabase
    .from('products')
    .update(product)
    .eq('id', productId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/products');
  redirect('/products');
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );
  const product = buildProductInsert(formData);

  await assertProductFamilyBelongsToCategory(
    supabase,
    product.category_id ?? null,
    product.family_id ?? null,
  );
  await assertPreparationTypeExists(
    supabase,
    product.preparation_type_id ?? null,
  );

  const { error } = await supabase.from('products').insert(product);

  if (error) throw new Error(error.message);

  revalidatePath('/products');
  redirect('/products');
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );

  const { error } = await supabase
    .from('products')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/products');
  redirect('/products');
}
