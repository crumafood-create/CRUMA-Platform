import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function SalesOrderPage({
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
    data: order,
  } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (!order) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Pedido
        </h1>

        <Link
          href="/sales-orders"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6 space-y-4">
        <div>
          <div className="text-sm text-gray-500">
            Pedido
          </div>

          <div className="font-semibold">
            {
              order.order_number
            }
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Estado
          </div>

          <div className="font-semibold">
            {order.status}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Total
          </div>

          <div className="font-semibold">
            $
            {Number(
              order.total,
            ).toFixed(2)}
          </div>
        </div>
      </div>

      <Link
        href={`/sales-orders/${order.id}/items`}
        className="rounded border px-4 py-2"
      >
        Productos
      </Link>

      <Link
  href={`/sales-orders/${order.id}/profit`}
  className="rounded border px-4 py-2"
>
  📊 Utilidad
</Link>

      {order.status ===
  'draft' && (
  <form
    action={confirmSalesOrder.bind(
      null,
      order.id,
    )}
  >
    <button className="rounded border px-4 py-2">
      Confirmar
    </button>
  </form>
)}

{order.status ===
  'confirmed' && (
  <form
    action={startPreparingSalesOrder.bind(
      null,
      order.id,
    )}
  >
    <button className="rounded border px-4 py-2">
      Preparar
    </button>
  </form>
)}

{order.status ===
  'preparing' && (
  <form
    action={markSalesOrderReady.bind(
      null,
      order.id,
    )}
  >
    <button className="rounded border px-4 py-2">
      Listo
    </button>
  </form>
)}

{order.status ===
  'ready' && (
  <form
    action={deliverSalesOrder.bind(
      null,
      order.id,
    )}
  >
    <button className="rounded border px-4 py-2">
      Entregar
    </button>
  </form>
)}
    </main>
  );
}
