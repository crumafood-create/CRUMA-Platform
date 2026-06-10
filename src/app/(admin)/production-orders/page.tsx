import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function ProductionOrdersPage() {
  const supabase = await createClient();

  const { data: orders } =
    await supabase
      .from('production_orders')
      .select(`
        *,
        recipes (
          products (
            name
          )
        )
      `)
      .order('created_at', {
        ascending: false,
      });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Producción
        </h1>

        <Link
          href="/production-orders/new"
          className="rounded border px-4 py-2"
        >
          Nueva Orden
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {orders?.length ? (
          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order.id}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {
                    order.recipes?.products?.name
                  }
                </div>

                <div>
                  Cantidad:
                  {' '}
                  {order.quantity}
                </div>

                <div>
                  Estado:
                  {' '}
                  {order.status}
                </div>

                <Link
                  href={`/production-orders/${order.id}`}
                  className="mt-2 inline-block rounded border px-3 py-1"
                >
                  <Link
                  href={`/production-orders/${order.id}`}
                  className="mt-2 inline-block rounded border px-3 py-1"
                >
                   Ver Producción
                 </Link>
    
              </div>
            ))}
          </div>
        ) : (
          <p>No hay órdenes.</p>
        )}
      </div>
    </main>
  );
}
