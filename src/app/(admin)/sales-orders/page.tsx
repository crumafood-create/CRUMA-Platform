import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function SalesOrdersPage() {
  const supabase =
    await createClient();

  const {
    data: orders,
  } = await supabase
    .from('sales_orders')
    .select('*')
    .order(
      'created_at',
      {
        ascending: false,
      },
    );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Pedidos
        </h1>

        <Link
          href="/sales-orders/new"
          className="rounded border px-4 py-2"
        >
          Nuevo Pedido
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {orders?.length ? (
          <div className="space-y-3">
            {orders.map(
              (order: any) => (
                <div
                  key={
                    order.id
                  }
                  className="rounded border p-4"
                >
                  <div className="font-semibold">
                    {
                      order.order_number
                    }
                  </div>

                  <div className="text-sm text-gray-500">
                    Estado:{' '}
                    {
                      order.status
                    }
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/sales-orders/${order.id}`}
                      className="rounded border px-3 py-1"
                    >
                      Ver Pedido
                    </Link>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <p>
            No hay pedidos.
          </p>
        )}
      </div>
    </main>
  );
}
