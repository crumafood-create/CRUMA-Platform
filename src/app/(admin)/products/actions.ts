'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  buildProductInsert,
  buildProductUpdate,
} from '@/modules/inventory/application/product-catalog-contract';
import {
  assertPreparationTypeExists,
  assertProductFamilyBelongsToCategory,
} from '@/modules/inventory/application/product-catalog-repository';
import { buildStorefrontProductUpsert } from '@/modules/storefront/application/storefront-product-contract';
import { upsertStorefrontProduct } from '@/modules/storefront/application/storefront-product-repository';

class ProductCreationError extends Error {}

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

  if (error) throw new Error(error.message);

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
  if (error) {
    if (error.code === '23505' && error.message.includes('"products_slug_key"')) {
      throw new ProductCreationError('Ya existe un producto con ese slug.', { cause: error });
    }
    if (error.code === '23505' && error.message.includes('"products_internal_code_key"')) {
      throw new ProductCreationError('Ya existe un producto con ese código interno.', { cause: error });
    }
    throw new ProductCreationError('No se pudo registrar el producto.', { cause: error });
  }

  revalidatePath('/products');
  redirect('/products');
}

export async function createProductForForm(formData: FormData) {
  try {
    await createProduct(formData);
  } catch (error) {
    if (error instanceof ProductCreationError) return { error: error.message };
    throw error;
  }
}

export async function saveStorefrontPublication(
  productId: string,
  formData: FormData,
) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );
  const publication = buildStorefrontProductUpsert(
    productId,
    formData,
    new Date().toISOString(),
  );

  await upsertStorefrontProduct(supabase, publication);

  revalidatePath(`/products/${productId}/edit`);
  revalidatePath('/catalogo');
  revalidatePath(`/producto/${publication.slug}`);
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.CATALOG_PRODUCT_MANAGE,
  );

  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw new Error(error.message);

  revalidatePath('/products');
  redirect('/products');
}
