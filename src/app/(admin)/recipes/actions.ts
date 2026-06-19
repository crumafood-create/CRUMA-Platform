'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createRecipe(formData: FormData) {
  const supabase = await createClient();

  const product_id = formData.get('product_id')?.toString().trim() ?? '';
  const name = formData.get('name')?.toString().trim() ?? '';
  const slug = formData.get('slug')?.toString().trim() ?? '';
  const internal_code = formData.get('internal_code')?.toString().trim() ?? '';
  const description = formData.get('description')?.toString().trim() || null;
  const yield_quantity = Number(formData.get('yield_quantity')) || 1;
  const unit_of_measure_id =
    formData.get('unit_of_measure_id')?.toString().trim() || null;
  const is_active = formData.get('is_active')?.toString() === 'true';

  if (!product_id || !name || !slug || !internal_code) {
    throw new Error('Producto, nombre, slug y código son obligatorios');
  }

  const { error } = await supabase
    .from('recipes')
    .insert({
      product_id,
      name,
      slug,
      internal_code,
      description,
      yield_quantity,
      unit_of_measure_id,
      is_active,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/recipes');
  redirect('/recipes');
}
