import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { PurchaseOrderItemForm } from '@/app/(admin)/_components/purchase-order-item-form';

import {
  createPurchaseOrderItem,
} from './actions';

export default async function PurchaseOrderItemsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase =
    await createClient();

  const [
    { data: order },
    { data: materials },
    { data: items },
  ] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single(),

    supabase
      .from('raw_materials')
      .select(
        'id, name, internal_code'
      )
      .eq('is_active', true)
      .order('name'),

    supabase
      .from(
        'purchase_order_items'
      )
      .select('*')
      .eq(
        'purchase_order_id',
        id
      ),
  ]);

  if (!order) {
    return null;
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Items de Compra
        </h1>

        <Link
          href="/purchase-orders"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <PurchaseOrderItemForm
        action={
          createPurchaseOrderItem
        }
        purchaseOrderId={
          order.id
        }
        materials={
          materials ?? []
        }
      />

      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Artículos
        </h2>

        {items?.length ? (
          <div className="space-y-3">
            {items.map(
              (item: any) => (
                <div
                  key={item.id}
                  className="rounded border p-4"
                >
                  <div>
                    Cantidad:{' '}
                    {item.quantity}
                  </div>

                  <div>
                    Costo Unitario:{' '}
                    $
                    {Number(
                      item.unit_cost
                    ).toFixed(
                      2
                    )}
                  </div>

                  <div className="font-semibold">
                    Total:{' '}
                    $
                    {Number(
                      item.total
                    ).toFixed(
                      2
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <p>
            No hay artículos.
          </p>
        )}
      </div>
    </main>
  );
}
