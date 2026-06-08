'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createProduct(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No autorizado');
  }

  const name =
    formData.get('name')?.toString() ?? '';

  const internal_code =
    formData
      .get('internal_code')
      ?.toString() ?? '';

  const slug =
    formData.get('slug')?.toString() ?? '';

  const short_description =
    formData
      .get('short_description')
      ?.toString() ?? '';

  const description =
    formData
      .get('description')
      ?.toString() ?? '';

  const image_url =
    formData
      .get('image_url')
      ?.toString() ?? '';

  const image_alt =
    formData
      .get('image_alt')
      ?.toString() ?? '';

  const seo_title =
    formData
      .get('seo_title')
      ?.toString() ?? '';

  const seo_description =
    formData
      .get('seo_description')
      ?.toString() ?? '';

  const status =
    formData.get('status')?.toString() ??
    'active';

  const is_featured =
    formData.get('is_featured') === 'on';

  const { error } = await supabase
    .from('products')
    .insert({
      name,
      internal_code,
      slug,
      short_description,
      description,
      image_url,
      image_alt,
      seo_title,
      seo_description,
      status,
      is_featured,
    });

  if (error) {
    console.error(error);

    throw new Error(
      'Error al crear producto'
    );
  }

  revalidatePath('/products');
}
