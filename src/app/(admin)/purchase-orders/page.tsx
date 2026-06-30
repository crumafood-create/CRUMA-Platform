import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type PurchaseOrder = {
  id: string;
  order_number: string;
  supplier_id: string;
  status: string;
  order_date: string;
  total: number;
};

type Supplier = {
  id: string;
  name: string;
};

function getStatusLabel(status: string) {
  switch (status) {
    case 'draft':
      return 'Borrador';

    case 'released':
      return 'Liberada';

    case 'partially_received':
      return 'Parcialmente Recibida';

    case 'received':
      return 'Recibida';

    case 'cancelled':
      return 'Cancelada';

    default:
      return status;
  }
}

export default async function PurchaseOrdersPage() {
  const supabase = await createClient();

  const [
    { data: orders },
    { data: suppliers },
  ] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', {
        ascending: false,
      }),

    supabase
      .from('suppliers')
      .select('id, name')
      .is('deleted_at', null),
  ]);

  const supplierMap = new Map(
    (suppliers ?? []).map(
      (supplier: Supplier) => [
        supplier.id,
        supplier.name,
      ],
    ),
  );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Compras
        </h1>

        <Link
          href="/purchase-orders/new"
          className="rounded border px-4 py-2"
        >
          Nueva Compra
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {orders?.length ? (
          <div className="space-y-3">
            {orders.map(
              (order: PurchaseOrder) => (
                <div
                  key={order.id}
                  className="rounded border p-4"
                >
                  <div className="font-semibold">
                    {order.order_number}
                  </div>

                  <div className="text-sm text-gray-500">
                    Proveedor:{' '}
                    {supplierMap.get(
                      order.supplier_id,
                    ) ?? '-'}
                  </div>

                  <div className="text-sm text-gray-500">
                    Fecha:{' '}
                    {order.order_date}
                  </div>

                  <div className="text-sm text-gray-500">
                    Estado:{' '}
                    {getStatusLabel(
                      order.status,
                    )}
                  </div>

                  <div className="mt-2 font-semibold">
                    Total: $
                    {Number(
                      order.total ?? 0,
                    ).toFixed(2)}
                  </div>

                  <Link
                    href={`/purchase-orders/${order.id}`}
                    className="mt-3 inline-block rounded border px-3 py-2 text-sm"
                  >
                    Ver Compra
                  </Link>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay compras registradas.
          </p>
        )}
      </div>
    </main>
  );
}
