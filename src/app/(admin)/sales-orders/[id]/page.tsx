import Link from 'next/link';
import { notFound } from 'next/navigation';

import { InvoiceIssueForm } from '@/modules/sales/components/forms/invoice-issue-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { assertSalesOrderStatus } from '@/modules/sales/application/sales-order-contract';
import { buildSalesOrderTimeline, getSalesOrderStatusMeta, isDeliveryAtRisk } from '@/modules/sales/application/sales-order-presentation';
import { Button } from '@/shared/ui/primitives/button';
import { Card, CardContent } from '@/shared/ui/primitives/card';

import {
  confirmSalesOrder,
  deliverSalesOrder,
  markSalesOrderReady,
  startPreparingSalesOrder,
} from '../actions';

export default async function SalesOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const [{ data: order, error }, { data: invoice }] = await Promise.all([
    supabase.from('sales_orders').select('*, customers(name)').eq('id', id).single(),
    supabase.from('sales_invoices').select('id, invoice_number').eq('sales_order_id', id).maybeSingle(),
  ]);
  if (error || !order) notFound();

  const status = assertSalesOrderStatus(order.status);
  const meta = getSalesOrderStatusMeta(status);
  const timeline = buildSalesOrderTimeline(status);
  const atRisk = isDeliveryAtRisk(status, order.delivery_date);
  const nextAction = status === 'draft'
    ? { label: 'Confirmar pedido', action: confirmSalesOrder.bind(null, order.id) }
    : status === 'confirmed'
      ? { label: 'Iniciar preparación', action: startPreparingSalesOrder.bind(null, order.id) }
      : status === 'preparing'
        ? { label: 'Marcar como listo', action: markSalesOrderReady.bind(null, order.id) }
        : status === 'ready'
          ? { label: 'Confirmar entrega', action: deliverSalesOrder.bind(null, order.id) }
          : null;

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/sales-orders" className="text-sm font-bold text-brand-blue">← Volver a pedidos</Link>
          <h1 className="mt-3 text-3xl font-black text-brand-black">{order.order_number}</h1>
          <p className="mt-1 text-sm text-brand-gray-75">{order.customers?.name ?? 'Cliente sin nombre'} · {meta.label}</p>
        </div>
        {nextAction ? <form action={nextAction.action}><Button type="submit">{nextAction.label}</Button></form> : null}
      </header>

      <Card>
        <CardContent>
          <h2 className="text-lg font-black text-brand-black">Seguimiento</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-5" aria-label="Progreso del pedido">
            {timeline.map((item) => (
              <li key={item.status} aria-current={item.state === 'current' ? 'step' : undefined} className={`rounded-xl border p-3 text-sm ${item.state === 'current' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : item.state === 'complete' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-brand-gray-25 text-brand-gray-50'}`}>
                <span className="block text-xs font-black uppercase">{item.state === 'complete' ? 'Completado' : item.state === 'current' ? 'Actual' : 'Pendiente'}</span>
                <strong>{item.label}</strong>
              </li>
            ))}
          </ol>
          {status === 'cancelled' ? <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">Este pedido fue cancelado.</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><p className="text-sm text-brand-gray-50">Total</p><p className="mt-1 text-2xl font-black">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(order.total))}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-brand-gray-50">Fecha de pedido</p><p className="mt-1 font-black">{order.order_date}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-brand-gray-50">Entrega prometida</p><p className={`mt-1 font-black ${atRisk ? 'text-red-700' : ''}`}>{order.delivery_date ?? 'Sin fecha'}{atRisk ? ' · Atrasada' : ''}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/sales-orders/${order.id}/items`}><Button variant="outline">Productos</Button></Link>
        <Link href={`/sales-orders/${order.id}/profit`}><Button variant="outline">Utilidad</Button></Link>
        {(status === 'confirmed' || status === 'preparing') ? <Link href="/mobile/picking"><Button variant="outline">Ver picking</Button></Link> : null}
      </div>

      {invoice ? (
        <Link href={`/invoices/${invoice.id}`} className="font-black text-brand-blue">Ver factura {invoice.invoice_number} →</Link>
      ) : status === 'delivered' ? (
        <InvoiceIssueForm salesOrderId={order.id} />
      ) : null}
    </main>
  );
}
