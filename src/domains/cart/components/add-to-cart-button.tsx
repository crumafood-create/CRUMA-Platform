'use client';

import type { Product }
from '@/domains/catalog/types/product.type';

import { Button }
from '@/shared/ui/button';

import { useCartStore }
from '../store/cart.store';

interface Props {

  product: Product;
}

export function AddToCartButton({
  product
}: Props) {

  const addItem =
    useCartStore(
      state => state.addItem
    );

  return (

    <Button

      onClick={() =>

        addItem({

          productId: product.id,

          slug: product.slug,

          name: product.name,

          imageUrl:
            product.image_url,

          retailPrice:
            product.retail_price,

          wholesalePrice:
            product.wholesale_price,

          quantity: 1
        })
      }
    >

      Agregar al carrito

    </Button>
  );
}
