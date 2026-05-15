'use client';

import Link
from 'next/link';

import { useCartStore }
from '../store/cart.store';

import { Button }
from '@/shared/ui/button';

export function CartView() {

  const {
    items,
    removeItem,
    clearCart
  } = useCartStore();

  const total = items.reduce(

    (acc, item) =>

      acc +
      ((item.retailPrice || 0) *
        item.quantity),

    0
  );

  return (

    <main className="mx-auto max-w-4xl p-8">

      <h1 className="mb-8 text-4xl font-bold">

        Carrito

      </h1>

      <div className="space-y-4">

        {items.map(item => (

          <div
            key={item.productId}
            className="flex items-center justify-between rounded-xl border p-4"
          >

            <div>

              <h3>
                {item.name}
              </h3>

              <p>
                Cantidad:
                {' '}
                {item.quantity}
              </p>

            </div>

            <Button
              variant="outline"
              onClick={() =>
                removeItem(
                  item.productId
                )
              }
            >

              Eliminar

            </Button>

          </div>
        ))}

      </div>

      <div className="mt-8 space-y-4">

        <p className="text-2xl font-bold">

          Total:
          {' '}
          ${total.toFixed(2)}

        </p>

        <Link href="/checkout">

  <Button>

    Checkout

  </Button>

</Link>

        <Button
          variant="outline"
          onClick={clearCart}
        >

          Vaciar carrito

        </Button>

      </div>

    </main>
  );
}
