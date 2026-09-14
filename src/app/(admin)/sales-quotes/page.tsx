import Link from 'next/link';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
const money = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
export default async function SalesQuotesPage() {
  const supabase = await createTypedClient();
  const { data, error } = await supabase.from('sales_quotes').select('id, quote_number, status, quote_date, valid_until, total_amount, customers(name)').order('created_at', { ascending: false });
  if (error) throw new Error('No se pudieron cargar las cotizaciones.');
  return <main className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-4xl font-bold">Cotizaciones</h1><Link href="/sales-quotes/new" className="rounded border px-4 py-2">Nueva cotización</Link></div><div className="space-y-3 rounded-2xl border p-6">{data?.length ? data.map((q) => <article key={q.id} className="flex items-center justify-between rounded border p-4"><div><div className="font-semibold">{q.quote_number}</div><div className="text-sm text-gray-600">{q.customers?.name ?? 'Cliente'} · {q.status} · Vence {q.valid_until}</div></div><div className="text-right"><div className="font-semibold">{money(Number(q.total_amount))}</div><Link className="underline" href={`/sales-quotes/${q.id}`}>Ver cotización</Link></div></article>) : <p>No hay cotizaciones.</p>}</div></main>;
}
