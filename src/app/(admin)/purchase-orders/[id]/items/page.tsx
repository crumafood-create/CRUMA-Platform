import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PurchaseOrderItemForm } from '@/modules/procurement/components/forms/purchase-order-item-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { createPurchaseOrderItem } from './actions';

export default async function PurchaseOrderItemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ rawMaterialId?: string }>;
}) {
  const [{ id }, { rawMaterialId }] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({ rawMaterialId: undefined }),
  ]);
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!order) notFound();

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Renglones de compra</h1>
        <div className="flex gap-2">
          {order.status === 'draft' ? (
            <Link
              href={`/raw-materials/new?returnToPurchaseOrderId=${order.id}`}
              className="rounded border px-4 py-2"
            >
              Crear materia prima
            </Link>
          ) : null}
          <Link href={`/purchase-orders/${id}`} className="rounded border px-4 py-2">Volver</Link>
        </div>
      </header>
      {order.status === 'draft' ? (
        <PurchaseOrderItemForm
          action={createPurchaseOrderItem}
          purchaseOrderId={order.id}
          userId={user?.id}
          materials={materials ?? []}
          initialMaterialId={
            materials?.some((material) => material.id === rawMaterialId)
              ? rawMaterialId
              : undefined
          }
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
