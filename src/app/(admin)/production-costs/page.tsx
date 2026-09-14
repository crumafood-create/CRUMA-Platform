import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function ProductionCostsPage() {
  const supabase = await createTypedClient();
  const { data: costs, error } = await supabase
    .from('production_costs')
    .select(`
      id, production_order_id, material_cost, labor_cost, overhead_cost,
      total_cost, unit_cost, calculation_version, calculated_at,
      production_orders(production_number, produced_quantity)
    `)
    .order('calculated_at', { ascending: false });
  if (error) throw new Error('No fue posible consultar los costos de producción.');

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Costos de producción</h1>
        <p className="text-sm text-gray-500">Costo real por lote, mano de obra e indirectos.</p>
      </div>
      <section className="space-y-3 rounded-2xl border p-6">
        {costs?.length ? costs.map((cost) => (
          <article key={cost.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-4">
            <div>
              <div className="font-semibold">{cost.production_orders?.production_number ?? '-'}</div>
              <div className="text-sm text-gray-500">
                {cost.production_orders?.produced_quantity ?? 0} unidades · versión {cost.calculation_version}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">${Number(cost.total_cost).toFixed(2)}</div>
              <div className="text-sm text-gray-500">${Number(cost.unit_cost).toFixed(4)} por unidad</div>
            </div>
            <Link href={`/production-costs/${cost.production_order_id}`} className="rounded border px-3 py-2 text-sm">
              Ver detalle
            </Link>
          </article>
        )) : <p className="text-gray-500">No hay costos calculados.</p>}
      </section>
    </main>
  );
}
