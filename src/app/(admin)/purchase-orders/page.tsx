import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  released: 'Liberada',
  partially_received: 'Parcialmente recibida',
  received: 'Recibida',
  cancelled: 'Cancelada',
};

export default async function PurchaseOrdersPage() {
  const supabase = await createTypedClient();
  const [{ data: orders }, { data: suppliers }] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('id, order_number, supplier_id, status, order_date, total')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('suppliers').select('id, name').is('deleted_at', null),
  ]);
  const supplierNames = new Map((suppliers ?? []).map((row) => [row.id, row.name]));

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Compras</h1>
        <Link href="/purchase-orders/new" className="rounded border px-4 py-2">
          Nueva compra
        </Link>
      </header>
      <section className="rounded-2xl border p-6">
        {orders?.length ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded border p-4">
                <div className="font-semibold">{order.order_number}</div>
                <div className="text-sm text-gray-500">
                  Proveedor: {supplierNames.get(order.supplier_id) ?? '-'}
                </div>
                <div className="text-sm text-gray-500">Fecha: {order.order_date}</div>
                <div className="text-sm text-gray-500">
                  Estado: {STATUS_LABELS[order.status] ?? order.status}
                </div>
                <div className="mt-2 font-semibold">Total: ${Number(order.total).toFixed(2)}</div>
                <Link
                  href={`/purchase-orders/${order.id}`}
                  className="mt-3 inline-block rounded border px-3 py-2 text-sm"
                >
                  Ver compra
                </Link>
                <Link
                  href={`/purchase-orders/${order.id}/items`}
                  className="mt-2 ml-2 inline-block rounded border px-3 py-2 text-sm"
                >
                  Renglones
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay compras registradas.</p>
        )}
      </section>
    </main>
  );
}
