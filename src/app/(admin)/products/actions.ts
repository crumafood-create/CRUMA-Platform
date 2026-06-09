'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function updateProduct(
  productId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('products')
    .update({
      name: formData.get('name'),
      slug: formData.get('slug'),
      internal_code: formData.get('internal_code'),

      category_id:
    formData.get('category_id') || null,

      family_id:
       formData.get('family_id') || null,

      flavor_id:
       formData.get('flavor_id') || null,

      min_stock:
       Number(
       formData.get('min_stock')) || 0,

      preparation_type_id:
        formData.get('preparation_type_id') || null,
      
      short_description:
        formData.get('short_description'),
      description:
        formData.get('description'),
      image_url:
        formData.get('image_url'),
      image_alt:
        formData.get('image_alt'),
      seo_title:
        formData.get('seo_title'),
      seo_description:
        formData.get('seo_description'),
      status:
        formData.get('status'),
      is_featured:
        formData.get('is_featured') === 'on',
      updated_at: new Date(),
    })
    .eq('id', productId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/products');

  redirect('/products');
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const name = formData.get('name')?.toString().trim() ?? '';
  const slug = formData.get('slug')?.toString().trim() ?? '';

  if (!name || !slug) {
    throw new Error('Nombre y slug son obligatorios');
  }

  const internal_code = formData.get('internal_code')?.toString().trim() || null;
  const short_description = formData.get('short_description')?.toString().trim() || null;
  const description = formData.get('description')?.toString().trim() || null;
  const image_url = formData.get('image_url')?.toString().trim() || null;
  const image_alt = formData.get('image_alt')?.toString().trim() || null;
  const seo_title = formData.get('seo_title')?.toString().trim() || null;
  const seo_description = formData.get('seo_description')?.toString().trim() || null;
  const status = formData.get('status')?.toString().trim() || 'active';
  const is_featured = formData.get('is_featured') === 'on';
  const min_stock = Number(formData.get('min_stock')) || 0;
  
  const { error } = await supabase.from('products').insert({
    name,
    slug,
    internal_code,
    
    category_id:
  formData.get('category_id') || null,

    family_id:
  formData.get('family_id') || null,

    flavor_id:
  formData.get('flavor_id') || null,

    preparation_type_id:
  formData.get('preparation_type_id') || null,
    
    short_description,
    description,
    image_url,
    image_alt,
    seo_title,
    seo_description,
    status,
    is_featured,
    min_stock,
  
  });

  if (error) {
    console.error(error);
    throw new Error('Error al crear producto');
  }

  revalidatePath('/products');
  redirect('/products');
}

export async function deleteProduct(
  productId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update({
      deleted_at: new Date(),
    })
    .eq('id', productId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/products');

  redirect('/products');
}
