import type { Product }
from '../types/product.type';

import { ProductCard }
from './product-card';

interface Props {

  products: Product[];
}

export function ProductGrid({
  products
}: Props) {

  return (

    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

      {products.map(product => (

        <ProductCard
          key={product.id}
          product={product}
        />
      ))}

    </div>
  );
}
