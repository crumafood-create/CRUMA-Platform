import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PurchaseOrderItemForm } from '@/app/(admin)/_components/purchase-order-item-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { createPurchaseOrderItem } from './actions';

export default async function PurchaseOrderItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const [{ data: order }, { data: materials }, { data: items }] = await Promise.all([
    supabase.from('purchase_orders').select('id, status').eq('id', id).is('deleted_at', null).maybeSingle(),
    supabase
      .from('raw_materials')
      .select('id, name, internal_code')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('purchase_order_items')
      .select('id, quantity, received_quantity, unit_cost, total')
      .eq('purchase_order_id', id),
  ]);
  if (!order) notFound();

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Renglones de compra</h1>
        <Link href={`/purchase-orders/${id}`} className="rounded border px-4 py-2">Volver</Link>
      </header>
      {order.status === 'draft' ? (
        <PurchaseOrderItemForm
          action={createPurchaseOrderItem}
          purchaseOrderId={order.id}
          materials={materials ?? []}
        />
      ) : null}
      <section className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Artículos</h2>
        {items?.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded border p-4">
                <div>Cantidad: {item.quantity}</div>
                <div>Recibida: {item.received_quantity}</div>
                <div>Costo unitario: ${Number(item.unit_cost).toFixed(2)}</div>
                <div className="font-semibold">Total: ${Number(item.total).toFixed(2)}</div>
              </article>
            ))}
          </div>
        ) : <p>No hay artículos.</p>}
      </section>
    </main>
  );
}
