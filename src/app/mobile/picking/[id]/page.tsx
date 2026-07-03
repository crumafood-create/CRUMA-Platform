import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import {
  pickItem,
} from '../actions';

export default async function PickingPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const {
    data: items,
  } = await supabase
    .from(
      'picking_order_items',
    )
    .select(`
      id,
      quantity,
      picked_quantity,
      status,
      product_id,
      products (
        name
      )
    `)
    .eq(
      'picking_order_id',
      id,
    );

  if (!items) {
    notFound();
  }

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">
        Picking
      </h1>

      <div className="space-y-4">
        {items.map(
          (
            item,
          ) => {
            const product =
              Array.isArray(
                item.products,
              )
                ? item
                    .products[0]
                : item.products;

            return (
              <div
                key={
                  item.id
                }
                className="rounded-2xl border p-6"
              >
                <div className="font-semibold text-lg">
                  {
                    product?.name
                  }
                </div>

                <div className="mt-4">
                  Cantidad:
                  {' '}
                  {
                    item.quantity
                  }
                </div>

                <div>
                  Recogido:
                  {' '}
                  {
                    item.picked_quantity
                  }
                </div>

                <div>
                  Estado:
                  {' '}
                  {
                    item.status
                  }
                </div>

                {item.status !==
                  'completed' && (
                  <form
                    action={pickItem.bind(
                      null,
                      item.id,
                    )}
                    className="mt-4"
                  >
                    <button
                      className="rounded border px-4 py-2"
                    >
                      ✅ Tomar
                    </button>
                  </form>
                )}
              </div>
            );
          },
        )}
      </div>
    </main>
  );
}
