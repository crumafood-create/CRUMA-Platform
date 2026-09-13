import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

const money = (value: number) => new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN',
}).format(value);

export default async function InvoicesPage() {
  const supabase = await createTypedClient();
  const { data: invoices, error } = await supabase
    .from('sales_invoices')
    .select('id, invoice_number, issued_on, due_date, status, total_amount, customers(name)')
    .order('issued_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error('No se pudieron cargar las facturas.');

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Facturación</h1>
        <p className="mt-2 text-sm text-gray-600">Comprobantes comerciales internos; no son CFDI.</p>
      </div>
      <div className="rounded-2xl border p-6">
        {invoices?.length ? (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <article key={invoice.id} className="flex flex-wrap items-center justify-between gap-4 rounded border p-4">
                <div>
                  <div className="font-semibold">{invoice.invoice_number}</div>
                  <div className="text-sm text-gray-600">{invoice.customers?.name ?? 'Cliente'} · {invoice.issued_on}</div>
                  <div className="text-sm">Estado: {invoice.status}{invoice.due_date ? ` · Vence ${invoice.due_date}` : ''}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{money(Number(invoice.total_amount))}</div>
                  <Link href={`/invoices/${invoice.id}`} className="mt-2 inline-block rounded border px-3 py-1">Ver factura</Link>
                </div>
              </article>
            ))}
          </div>
        ) : <p>No hay facturas emitidas.</p>}
      </div>
    </main>
  );
}
