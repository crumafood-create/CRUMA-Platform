import { createQuote } from '@/app/(admin)/sales-quotes/actions';
type Customer = { id: string; customer_code: string; name: string };
export function SalesQuoteForm({ customers }: { customers: Customer[] }) {
  const today = new Date().toISOString().slice(0, 10);
  return <form action={createQuote} className="space-y-4 rounded-2xl border p-6">
    <label className="block space-y-1"><span className="text-sm font-medium">Cliente</span>
      <select name="customer_id" required className="block w-full rounded border px-3 py-2"><option value="">Selecciona un cliente</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.customer_code} · {c.name}</option>)}</select>
    </label>
    <label className="block space-y-1"><span className="text-sm font-medium">Vigencia</span><input type="date" name="valid_until" min={today} required className="block rounded border px-3 py-2" /></label>
    <label className="block space-y-1"><span className="text-sm font-medium">Condiciones</span><textarea name="terms" rows={3} className="block w-full rounded border px-3 py-2" /></label>
    <label className="block space-y-1"><span className="text-sm font-medium">Notas</span><textarea name="notes" rows={3} className="block w-full rounded border px-3 py-2" /></label>
    <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">Crear cotización</button>
  </form>;
}
