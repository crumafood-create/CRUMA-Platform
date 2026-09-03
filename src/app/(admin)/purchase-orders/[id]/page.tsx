import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { cancelPurchaseOrder, releasePurchaseOrder } from '../actions';
import { receivePurchaseOrder } from '../receiving-actions';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  released: 'Liberada',
  partially_received: 'Parcialmente recibida',
  received: 'Recibida',
  cancelled: 'Cancelada',
};

export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const { data: order } = await supabase
    .from('purchase_orders')
    .select('id, order_number, supplier_id, order_date, expected_date, status, total, notes')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!order) notFound();
  const { data: supplier } = await supabase
    .from('suppliers').select('name').eq('id', order.supplier_id).maybeSingle();
  const canReceive = order.status === 'released' || order.status === 'partially_received';
  const canCancel = order.status === 'draft' || order.status === 'released';

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Compra</h1>
          <p className="mt-1 text-sm text-gray-500">{order.order_number}</p>
        </div>
        <Link href="/purchase-orders" className="rounded border px-4 py-2">Volver</Link>
      </header>
      <section className="space-y-4 rounded-2xl border p-6">
        <Detail label="Proveedor" value={supplier?.name ?? '-'} />
        <Detail label="Fecha" value={order.order_date} />
        <Detail label="Fecha esperada" value={order.expected_date ?? '-'} />
        <Detail label="Estado" value={STATUS_LABELS[order.status] ?? order.status} />
        <Detail label="Total" value={`$${Number(order.total).toFixed(2)}`} />
        {order.notes ? <Detail label="Notas" value={order.notes} /> : null}
      </section>
      <div className="flex flex-wrap gap-3">
        <Link href={`/purchase-orders/${order.id}/items`} className="rounded border px-4 py-2">
          Ver renglones
        </Link>
        {order.status === 'draft' ? (
          <Action action={releasePurchaseOrder.bind(null, order.id)} label="Liberar compra" />
        ) : null}
        {canReceive ? (
          <Action action={receivePurchaseOrder.bind(null, order.id)} label="Recibir pendiente" green />
        ) : null}
        {canCancel ? (
          <Action action={cancelPurchaseOrder.bind(null, order.id)} label="Cancelar" danger />
        ) : null}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><div className="text-sm text-gray-500">{label}</div><div className="font-semibold">{value}</div></div>;
}

function Action({
  action, label, green = false, danger = false,
}: {
  action: () => Promise<void>; label: string; green?: boolean; danger?: boolean;
}) {
  const color = green ? 'bg-green-50 text-green-700' : danger ? 'border-red-300 text-red-700' : '';
  return <form action={action}><button type="submit" className={`rounded border px-4 py-2 ${color}`}>{label}</button></form>;
}
