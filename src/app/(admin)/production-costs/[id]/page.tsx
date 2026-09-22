import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductionCostForm } from '@/modules/manufacturing/components/forms/production-cost-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

const money = (value: number) => `$${Number(value).toFixed(4)}`;

export default async function ProductionCostPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const { data: cost, error } = await supabase
    .from('production_costs')
    .select(`
      id, production_order_id, material_cost, labor_cost, overhead_cost, total_cost,
      unit_cost, calculation_version, source_consumption_count, calculated_at,
      production_orders(production_number, produced_quantity)
    `)
    .eq('production_order_id', id)
    .maybeSingle();
  if (error) throw new Error('No fue posible consultar el costo de producción.');
  if (!cost) notFound();

  const { data: history, error: historyError } = await supabase
    .from('production_cost_history')
    .select('id, version, material_cost, labor_cost, overhead_cost, total_cost, unit_cost, calculated_at')
    .eq('production_order_id', id)
    .order('version', { ascending: false });
  if (historyError) throw new Error('No fue posible consultar el historial de costos.');

  const values = [
    ['Materia prima', cost.material_cost],
    ['Mano de obra', cost.labor_cost],
    ['Costos indirectos', cost.overhead_cost],
    ['Costo total', cost.total_cost],
    ['Costo unitario', cost.unit_cost],
  ] as const;

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Costo de producción</h1>
          <p className="text-gray-500">{cost.production_orders?.production_number}</p>
        </div>
        <Link href="/production-costs" className="rounded border px-4 py-2">Volver</Link>
      </div>

      <section className="grid gap-4 rounded-2xl border p-6 md:grid-cols-3">
        {values.map(([label, value]) => (
          <div key={label} className="rounded border p-4">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-bold">{money(value)}</div>
          </div>
        ))}
        <div className="rounded border p-4 text-sm text-gray-500">
          Versión {cost.calculation_version} · {cost.source_consumption_count} consumos
        </div>
      </section>

      <ProductionCostForm productionOrderId={id} laborCost={cost.labor_cost} overheadCost={cost.overhead_cost} />

      <section className="space-y-3 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">Historial de cálculos</h2>
        {history?.map((entry) => (
          <div key={entry.id} className="grid gap-2 rounded border p-3 text-sm md:grid-cols-4">
            <strong>Versión {entry.version}</strong>
            <span>Material: {money(entry.material_cost)}</span>
            <span>MO + indirectos: {money(entry.labor_cost + entry.overhead_cost)}</span>
            <span>Total: {money(entry.total_cost)}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
