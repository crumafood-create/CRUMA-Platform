import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { SalesOrderItemForm } from '@/app/(admin)/_components/sales-order-item-form';

import { createSalesOrderItem } from '../actions';

export default async function SalesOrderItemsPage({
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

  const [
    { data: order },
    { data: products },
    { data: items },
  ] =
    await Promise.all([
      supabase
        .from(
          'sales_orders',
        )
        .select(
          'id, order_number',
        )
        .eq(
          'id',
          id,
        )
        .single(),

      supabase
        .from(
          'products',
        )
        .select(
          'id, name',
        )
        .eq(
          'status',
          'active',
        )
        .is(
          'deleted_at',
          null,
        )
        .order('name'),

      supabase
        .from(
          'sales_order_items',
        )
        .select('*')
        .eq(
          'sales_order_id',
          id,
        ),
    ]);

  const productMap =
    new Map(
      (
        products ??
        []
      ).map(
        (
          product: any,
        ) => [
          product.id,
          product.name,
        ],
      ),
    );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Productos
          </h1>

          <p className="text-gray-500">
            {
              order?.order_number
            }
          </p>
        </div>

        <Link
          href={`/sales-orders/${id}`}
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        <SalesOrderItemForm
          action={
            createSalesOrderItem
          }
          salesOrderId={
            id
          }
          products={
            products ??
            []
          }
        />
      </div>

      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Productos del pedido
        </h2>

        {items?.length ? (
          <div className="space-y-3">
            {items.map(
              (
                item: any,
              ) => (
                <div
                  key={
                    item.id
                  }
                  className="rounded border p-4"
                >
                  <div className="font-semibold">
                    {productMap.get(
                      item.product_id,
                    ) ?? '-'}
                  </div>

                  <div className="text-sm text-gray-500">
                    Cantidad:{' '}
                    {
                      item.quantity
                    }
                  </div>

                  <div className="text-sm text-gray-500">
                    Precio:{' '}
                    $
                    {
                      item.unit_price
                    }
                  </div>

                  <div className="font-semibold">
                    Total:{' '}
                    $
                    {
                      item.total
                    }
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <p>
            No hay productos.
          </p>
        )}
      </div>
    </main>
  );
}
