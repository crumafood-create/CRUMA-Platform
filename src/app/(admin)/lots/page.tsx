import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

const statusLabel: Record<string, string> = {
  available: 'Disponible',
  depleted: 'Agotado',
  hold: 'Retenido',
  rejected: 'Rechazado',
};

export default async function ProductionLotsPage() {
  const supabase = await createTypedClient();
  const { data: lots, error } = await supabase.from('product_lots').select(`
    id, lot_number, initial_quantity, quantity, status, expiration_date,
    production_order_id, products(name), warehouses(name),
    inventory_locations(name)
  `).order('created_at', { ascending: false });
  if (error) throw new Error('No fue posible consultar los lotes producidos.');

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-4xl font-bold">Lotes producidos</h1>
          <p className="text-sm text-gray-500">Inventario liberado y trazabilidad por orden.</p></div>
        <Link href="/lots/release" className="rounded border px-4 py-2">Liberar salida</Link>
      </div>
      <section className="space-y-3 rounded-2xl border p-6">
        {lots?.length ? lots.map((lot) => (
          <article key={lot.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-4">
            <div><strong>{lot.lot_number}</strong>
              <div className="text-sm text-gray-500">{lot.products?.name ?? '-'}</div></div>
            <div className="text-sm">
              <div>{lot.quantity} de {lot.initial_quantity} unidades</div>
              <div>Caduca: {lot.expiration_date ?? '-'}</div>
            </div>
            <div className="text-sm">{statusLabel[lot.status] ?? lot.status}<br />
              {lot.warehouses?.name ?? '-'} · {lot.inventory_locations?.name ?? '-'}</div>
            {lot.production_order_id ? <Link
              href={`/lots/production/${lot.production_order_id}`}
              className="rounded border px-3 py-2 text-sm"
            >Trazabilidad</Link> : null}
          </article>
        )) : <p className="text-gray-500">No hay lotes producidos.</p>}
      </section>
    </main>
  );
}
