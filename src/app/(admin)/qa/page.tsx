import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  passed: 'Aprobada',
  failed: 'Fallida',
  hold: 'Retenida',
};

export default async function QualityPage() {
  const supabase = await createTypedClient();
  const { data: inspections, error } = await supabase
    .from('quality_inspections')
    .select(`
      id, status, result, sampled_quantity, accepted_quantity,
      rejected_quantity, inspected_at,
      production_outputs(
        quality_status,
        products(name),
        production_orders(production_number)
      )
    `)
    .order('inspected_at', { ascending: false });
  if (error) throw new Error('No fue posible consultar las inspecciones.');

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Control de calidad</h1>
          <p className="text-sm text-gray-500">Inspección y liberación de salidas producidas.</p>
        </div>
        <Link href="/qa/create" className="rounded border px-4 py-2">Nueva inspección</Link>
      </div>

      <section className="space-y-3 rounded-2xl border p-6">
        {inspections?.length ? inspections.map((inspection) => (
          <article key={inspection.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-4">
            <div>
              <div className="font-semibold">{inspection.production_outputs?.products?.name ?? '-'}</div>
              <div className="text-sm text-gray-500">
                Orden {inspection.production_outputs?.production_orders?.production_number ?? '-'}
              </div>
            </div>
            <div className="text-sm">
              <strong>{statusLabel[inspection.status] ?? inspection.status}</strong>
              <div>{inspection.accepted_quantity} aceptadas · {inspection.rejected_quantity} rechazadas</div>
            </div>
            <Link href={`/qa/${inspection.id}`} className="rounded border px-3 py-2 text-sm">
              Ver inspección
            </Link>
          </article>
        )) : <p className="text-gray-500">No hay inspecciones registradas.</p>}
      </section>
    </main>
  );
}
