import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { cancelInvoice } from '../actions';

const money = (value: number) => new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN',
}).format(value);

export default async function InvoiceDetailPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();

  const { data: invoice, error } = await (supabase as any)
    .from('sales_invoices')
    .select('*')
    .eq('id', id)
    .single();

  // Redirige a página 404 si la factura no existe o falla la consulta principal
  if (error || !invoice) {
    notFound();
  }

  const [customerResult, orderResult, accountResult, itemsResult, paymentsResult] = await Promise.all([
    supabase.from('customers').select('name, company_name, tax_id').eq('id', invoice.customer_id).single(),
    supabase.from('sales_orders').select('order_number').eq('id', invoice.sales_order_id).single(),
    supabase.from('accounts_receivable').select('paid_amount, balance, status').eq('id', invoice.account_receivable_id).single(),
    supabase.from('sales_invoice_items').select('id, product_code, description, quantity, unit_price, discount, line_total').eq('invoice_id', id).order('created_at'),
    supabase.from('accounts_receivable_payments').select('id, payment_date, amount, payment_method, reference').eq('account_receivable_id', invoice.account_receivable_id).order('payment_date'),
  ]);

  if (customerResult.error || orderResult.error || accountResult.error || itemsResult.error || paymentsResult.error) {
    throw new Error('No fue posible cargar el detalle completo de la factura.');
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">{invoice.invoice_number}</h1>
          <p className="text-sm text-gray-600">Factura comercial interna · CFDI no solicitado</p>
        </div>
        <Link href="/invoices" className="rounded border px-4 py-2">Volver</Link>
      </div>

      <section className="grid gap-4 rounded-2xl border p-6 md:grid-cols-2">
        <div><span className="text-sm text-gray-500">Cliente</span><div className="font-semibold">{customerResult.data?.name}</div></div>
        <div><span className="text-sm text-gray-500">Pedido</span><div><Link className="underline" href={`/sales-orders/${invoice.sales_order_id}`}>{orderResult.data?.order_number}</Link></div></div>
        <div><span className="text-sm text-gray-500">Emisión</span><div>{invoice.issued_on}</div></div>
        <div><span className="text-sm text-gray-500">Vencimiento</span><div>{invoice.due_date ?? 'Sin fecha'}</div></div>
        <div><span className="text-sm text-gray-500">Estado</span><div>{invoice.status}</div></div>
        <div><span className="text-sm text-gray-500">Saldo</span><div>{money(Number(accountResult.data?.balance ?? 0))}</div></div>
      </section>

      <section className="overflow-x-auto rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Partidas facturadas</h2>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="py-2">Código</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead>
          <tbody>{itemsResult.data?.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.product_code ?? '—'}</td><td>{item.description}</td>
              <td>{Number(item.quantity)}</td><td>{money(Number(item.unit_price))}</td><td>{money(Number(item.line_total))}</td>
            </tr>
          ))}</tbody>
          <tfoot><tr className="font-semibold"><td colSpan={4} className="pt-3 text-right">Total</td><td className="pt-3">{money(Number(invoice.total_amount))}</td></tr></tfoot>
        </table>
      </section>

      <section className="rounded-2xl border p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Abonos aplicados</h2><Link className="rounded border px-3 py-1" href={`/accounts-receivable/${invoice.account_receivable_id}`}>Ver cuenta</Link></div>
        {paymentsResult.data?.length ? <ul className="mt-4 space-y-2">{paymentsResult.data.map((payment) => (
          <li key={payment.id} className="rounded border p-3">{payment.payment_date} · {money(Number(payment.amount))} · {payment.payment_method ?? 'Sin método'} · {payment.reference ?? 'Sin referencia'}</li>
        ))}</ul> : <p className="mt-4 text-sm text-gray-600">Sin abonos registrados.</p>}
      </section>

      {invoice.status === 'issued' && (
        <form action={cancelInvoice.bind(null, invoice.id)} className="space-y-3 rounded-2xl border border-red-200 p-6">
          <h2 className="text-xl font-semibold">Cancelar factura</h2>
          <label className="block space-y-1"><span className="text-sm font-medium">Motivo</span><input name="reason" required className="block w-full rounded border px-3 py-2" /></label>
          <button type="submit" className="rounded bg-red-600 px-4 py-2 text-white">Cancelar factura</button>
        </form>
      )}
    </main>
  );
}