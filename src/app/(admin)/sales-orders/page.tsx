import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { requireRows } from '@/modules/core/application/critical-read';
import { assertSalesOrderStatus } from '@/modules/sales/application/sales-order-contract';
import { getSalesOrderStatusMeta, isDeliveryAtRisk } from '@/modules/sales/application/sales-order-presentation';
import { Button } from '@/shared/ui/primitives/button';
import { Card, CardContent } from '@/shared/ui/primitives/card';

const tones = {
  neutral: 'bg-brand-gray-25 text-brand-gray-75',
  info: 'bg-blue-50 text-blue-800',
  success: 'bg-emerald-50 text-emerald-800',
  critical: 'bg-red-50 text-red-800',
} as const;

function money(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

export default async function SalesOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createTypedClient();
  let query = supabase
    .from('sales_orders')
    .select('id, order_number, status, total, delivery_date, created_at, customers(name)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (status && ['draft', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
    query = query.eq('status', status);
  }
  const orders = requireRows(await query, 'órdenes de venta');
  const filters = [
    ['all', 'Todos'],
    ['draft', 'Borradores'],
    ['confirmed', 'Confirmados'],
    ['preparing', 'Preparación'],
    ['ready', 'Listos'],
    ['delivered', 'Entregados'],
  ] as const;

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Ventas</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Pedidos</h1>
          <p className="mt-1 text-sm text-brand-gray-75">Seguimiento operativo desde captura hasta entrega.</p>
        </div>
        <Link href="/sales-orders/new"><Button>Nuevo pedido</Button></Link>
      </header>

      <nav aria-label="Filtrar pedidos" className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(([key, label]) => {
          const active = key === 'all' ? !status : status === key;
          return (
            <Link
              key={key}
              href={key === 'all' ? '/sales-orders' : `/sales-orders?status=${key}`}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${active ? 'bg-brand-blue text-white' : 'bg-brand-gray-25 text-brand-black'}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {orders.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => {
            const orderStatus = assertSalesOrderStatus(order.status);
            const meta = getSalesOrderStatusMeta(orderStatus);
            const atRisk = isDeliveryAtRisk(orderStatus, order.delivery_date);
            return (
              <Card key={order.id}>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-brand-black">{order.order_number}</p>
                      <p className="mt-1 text-sm text-brand-gray-75">{order.customers?.name ?? 'Cliente sin nombre'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${tones[meta.tone]}`}>{meta.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-y border-brand-gray-25 py-3 text-sm">
                    <div><span className="block text-brand-gray-50">Total</span><strong>{money(order.total)}</strong></div>
                    <div><span className="block text-brand-gray-50">Entrega</span><strong className={atRisk ? 'text-red-700' : ''}>{order.delivery_date ?? 'Sin fecha'}{atRisk ? ' · Atrasada' : ''}</strong></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-gray-50">Paso {meta.step || '—'} de 5</span>
                    <Link href={`/sales-orders/${order.id}`} className="font-black text-brand-blue">Dar seguimiento →</Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><CardContent><p className="py-8 text-center text-brand-gray-75">No hay pedidos con este filtro.</p></CardContent></Card>
      )}
    </main>
  );
}
