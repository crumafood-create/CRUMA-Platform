import Link
from 'next/link';

import type { Product }
from '../types/product.type';

import { Card }
from '@/shared/ui/card';

import { ProductImage }
from './product-image';

import { ProductPrice }
from './product-price';

interface Props {

  product: Product;

  isB2B?: boolean;
}

export function ProductCard({
  product,
  isB2B
}: Props) {

  return (

    <Link
      href={`/producto/${product.slug}`}
    >

      <Card className="space-y-4">

        <ProductImage
          src={product.image_url}
          alt={product.name}
        />

        <div className="space-y-2">

          <h3 className="font-semibold">

            {product.name}

          </h3>

          <p className="line-clamp-2 text-sm text-gray-500">

            {product.description}

          </p>

          <ProductPrice
            retailPrice={product.retail_price}
            wholesalePrice={product.wholesale_price}
            isB2B={isB2B}
          />

        </div>

      </Card>

    </Link>
  );
}
