import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import {
  cancelPurchaseOrder,
  releasePurchaseOrder,
  updatePurchaseOrderFreight,
  updatePurchaseOrderSupplier,
} from '../actions';

type PurchaseOrderDetail = {
  id: string;
  order_number: string;
  supplier_id: string;
  order_date: string;
  expected_date: string | null;
  status: string;
  subtotal: number;
  freight_amount: number;
  total: number;
  notes: string | null;
};

type PurchaseOrderDetailReader = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        is: (column: string, value: null) => {
          maybeSingle: () => Promise<{
            data: PurchaseOrderDetail | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

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
  const { data: order } = await (supabase as unknown as PurchaseOrderDetailReader)
    .from('purchase_orders')
    .select('id, order_number, supplier_id, order_date, expected_date, status, subtotal, freight_amount, total, notes')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!order) notFound();
  const { data: supplier } = await supabase
    .from('suppliers').select('name').eq('id', order.supplier_id).maybeSingle();
  const { data: availableSuppliers, error: suppliersError } = order.status === 'draft'
    ? await supabase
      .from('suppliers')
      .select('id, name')
      .eq('is_active', true)
      .is('deleted_at', null)
    : { data: [], error: null };
  if (suppliersError) throw new Error('No fue posible cargar los proveedores disponibles.');
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
        {order.status === 'draft' ? (
          <form action={updatePurchaseOrderSupplier} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="purchase_order_id" value={order.id} />
            <label className="grid gap-1 font-medium">
              Proveedor
              <select
                name="supplier_id"
                defaultValue={order.supplier_id}
                required
                className="rounded border p-3"
              >
                {!availableSuppliers?.some((option) => option.id === order.supplier_id) ? (
                  <option value={order.supplier_id}>{supplier?.name ?? 'Proveedor actual'}</option>
                ) : null}
                {(availableSuppliers ?? []).map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded border px-4 py-3">
              Guardar proveedor
            </button>
          </form>
        ) : <Detail label="Proveedor" value={supplier?.name ?? '-'} />}
        <Detail label="Fecha" value={order.order_date} />
        <Detail label="Fecha esperada" value={order.expected_date ?? '-'} />
        <Detail label="Estado" value={STATUS_LABELS[order.status] ?? order.status} />
        <Detail label="Productos" value={`$${Number(order.subtotal).toFixed(4)} MXN`} />
        <Detail label="Flete" value={`$${Number(order.freight_amount).toFixed(4)} MXN`} />
        <Detail label="Total" value={`$${Number(order.total).toFixed(2)}`} />
        {order.status === 'draft' ? (
          <form action={updatePurchaseOrderFreight} className="flex flex-wrap items-end gap-3 border-t pt-4">
            <input type="hidden" name="purchase_order_id" value={order.id} />
            <label className="grid gap-1 font-medium">
              Flete (MXN; puede ser cero)
              <input
                name="freight_amount"
                type="number"
                min="0"
                step="0.0001"
                defaultValue={order.freight_amount}
                required
                className="rounded border p-3"
              />
            </label>
            <button type="submit" className="rounded border px-4 py-3">Guardar flete</button>
          </form>
        ) : null}
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
  <Link
    href={`/mobile/receiving/${order.id}`}
    className="rounded border border-green-300 bg-green-50 px-4 py-2 text-green-700"
  >
    Registrar recepción
  </Link>
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
  action,
  label,
  danger = false,
}: {
  action: () => Promise<void>;
  label: string;
  danger?: boolean;
}) {
  const color = danger
    ? 'border-red-300 text-red-700'
    : '';

  return (
    <form action={action}>
      <button
        type="submit"
        className={`rounded border px-4 py-2 ${color}`}
      >
        {label}
      </button>
    </form>
  );
}
