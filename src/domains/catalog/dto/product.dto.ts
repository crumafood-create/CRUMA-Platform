import type { Product }
from '../types/product.type';

export function productDto(
  data: any
): Product {

  return {

    id: data.id,

    slug: data.slug,

    name: data.name,

    description: data.description,

    image_url: data.image_url,

    retail_price: data.retail_price,

    wholesale_price: data.wholesale_price,

    stock_quantity: data.stock_quantity,

    is_active: data.is_active,

    created_at: data.created_at
  };
}
