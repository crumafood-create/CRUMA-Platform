import type { Product }
from '../types/product.type';

import { Card }
from '@/shared/ui/card';

interface Props {

  product: Product;
}

export function ProductCard({
  product
}: Props) {

  return (

    <Card>

      <h3>
        {product.name}
      </h3>

      <p>
        {product.description}
      </p>

    </Card>
  );
}
