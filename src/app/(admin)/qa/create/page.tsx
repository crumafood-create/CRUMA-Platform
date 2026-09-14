import Link from 'next/link';

import { QualityInspectionForm } from '@/app/(admin)/_components/quality-inspection-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function CreateQualityInspectionPage({
  searchParams,
}: { searchParams: Promise<{ production_order_id?: string }> }) {
  const { production_order_id: productionOrderId } = await searchParams;
  const supabase = await createTypedClient();
  let query = supabase
    .from('production_outputs')
    .select(`
      id, quantity_produced, production_order_id, quality_status,
      products(name),
      production_orders(production_number)
    `)
    .neq('quality_status', 'released')
    .order('created_at', { ascending: false });
  if (productionOrderId) query = query.eq('production_order_id', productionOrderId);
  const { data: outputs, error } = await query;
  if (error) throw new Error('No fue posible consultar las salidas de producción.');

  const options = (outputs ?? []).map((output) => ({
    id: output.id,
    quantity: output.quantity_produced,
    label: `${output.production_orders?.production_number ?? '-'} · ${output.products?.name ?? '-'}`,
  }));

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Nueva inspección</h1>
          <p className="text-sm text-gray-500">Registra la muestra, criterios y defectos observados.</p>
        </div>
        <Link href="/qa" className="rounded border px-4 py-2">Volver</Link>
      </div>
      {options.length ? (
        <QualityInspectionForm
          outputs={options}
          initialOutputId={options.length === 1 ? options[0]?.id ?? '' : ''}
        />
      ) : (
        <p className="rounded border p-6 text-gray-500">
          No hay salidas pendientes de inspección.
        </p>
      )}
    </main>
  );
}
