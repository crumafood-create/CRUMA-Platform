import Link from 'next/link';

import { ProductionLotReleaseForm } from '@/modules/manufacturing/components/forms/production-lot-release-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function ReleaseProductionLotPage({
  searchParams,
}: { searchParams: Promise<{ output_id?: string }> }) {
  const { output_id: outputId } = await searchParams;
  const supabase = await createTypedClient();
  const [{ data: rawOutputs, error }, { data: warehouses }, { data: locations }] =
    await Promise.all([
      supabase.from('production_outputs').select(`
        id, production_order_id, quantity_produced,
        products(name), production_orders(production_number)
      `).eq('quality_status', 'released').order('created_at'),
      supabase.from('warehouses').select('id, name').eq('is_active', true).order('name'),
      supabase.from('inventory_locations').select('id, name')
        .eq('is_active', true).is('deleted_at', null).order('name'),
    ]);
  if (error) throw new Error('No fue posible consultar las salidas liberadas.');

  const outputIds = (rawOutputs ?? []).map((output) => output.id);
  const { data: registered } = outputIds.length
    ? await supabase.from('product_lots').select('production_output_id')
      .in('production_output_id', outputIds)
    : { data: [] };
  const registeredIds = new Set(
    (registered ?? []).map((item) => item.production_output_id),
  );
  const outputs = (rawOutputs ?? []).filter((output) => !registeredIds.has(output.id))
    .map((output) => ({
      id: output.id,
      productionOrderId: output.production_order_id,
      quantity: output.quantity_produced,
      label: `${output.production_orders?.production_number ?? '-'} · ${output.products?.name ?? '-'}`,
    }));

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-4xl font-bold">Liberar lote</h1>
          <p className="text-sm text-gray-500">Registra una salida aprobada como inventario disponible.</p></div>
        <Link href="/lots" className="rounded border px-4 py-2">Volver</Link>
      </div>
      {outputs.length ? <ProductionLotReleaseForm
        outputs={outputs}
        warehouses={(warehouses ?? []).map((item) => ({ id: item.id, label: item.name }))}
        locations={(locations ?? []).map((item) => ({ id: item.id, label: item.name }))}
        initialOutputId={outputs.some((item) => item.id === outputId) ? outputId ?? '' : ''}
      /> : <p className="rounded border p-6 text-gray-500">No hay salidas aprobadas pendientes.</p>}
    </main>
  );
}
