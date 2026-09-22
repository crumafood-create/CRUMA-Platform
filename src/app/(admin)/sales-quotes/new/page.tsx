import Link from 'next/link';
import { SalesQuoteForm } from '@/modules/sales/components/forms/sales-quote-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
export default async function NewSalesQuotePage() {
  const supabase = await createTypedClient();
  const { data, error } = await supabase.from('customers').select('id, customer_code, name').eq('is_active', true).is('deleted_at', null).order('name');
  if (error) throw new Error('No se pudieron cargar los clientes.');
  return <main className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-4xl font-bold">Nueva cotización</h1><Link href="/sales-quotes" className="rounded border px-4 py-2">Volver</Link></div><SalesQuoteForm customers={data ?? []} /></main>;
}
