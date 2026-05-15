import { createClient }
from '@/infrastructure/supabase/server';

import { productDto }
from '../dto/product.dto';

export async function getProducts() {

  const supabase = await createClient();

  const { data, error } = await supabase

    .from('products')

    .select(`
      id,
      slug,
      name,
      description,
      image_url,
      is_active,
      created_at
    `)

    .eq('is_active', true)

    .order('created_at', {
      ascending: false
    });

  if (error) {
    throw error;
  }

  return data.map(productDto);
}
