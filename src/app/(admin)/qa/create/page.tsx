import Link from 'next/link';

import { QualityInspectionForm } from '@/modules/quality/components/forms/quality-inspection-form';
import { QualitySampleSummary } from '@/modules/quality/components/quality-sample-summary';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function CreateQualityInspectionPage({
  searchParams,
}: { searchParams: Promise<{ production_order_id?: string }> }) {
  const { production_order_id: productionOrderId } = await searchParams;
  const supabase = await createTypedClient();
  let query = supabase
    .from('production_outputs')
    .select(`
      id, quantity_produced, mass_quantity_produced, production_order_id, quality_status,
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
    label: `${output.production_orders?.production_number ?? '-'} · ${output.products?.name ?? '-'}${output.mass_quantity_produced !== null ? ` · ${Number(output.mass_quantity_produced).toFixed(4)} kg` : ''}`,
  }));

  const { data: sampleRows, error: sampleRowsError } = await supabase
    .from('product_lot_quality_samples')
    .select('product_lot_id, purpose, quantity')
    .in('status', ['pending_inspection', 'in_custody']);
  if (sampleRowsError) {
    throw new Error('No fue posible consultar las muestras apartadas para Calidad.');
  }

  const sampleLotIds = [...new Set((sampleRows ?? []).map((sample) => sample.product_lot_id))];
  const { data: sampleLots, error: sampleLotsError } = sampleLotIds.length
    ? await supabase
        .from('product_lots')
        .select('id, lot_number, products(name)')
        .in('id', sampleLotIds)
    : { data: [], error: null };
  if (sampleLotsError) {
    throw new Error('No fue posible consultar los lotes de las muestras de Calidad.');
  }

  const samplesByLot = new Map<string, { immediateInspection: number; safetyRetention: number }>();
  for (const sample of sampleRows ?? []) {
    const quantities = samplesByLot.get(sample.product_lot_id) ?? {
      immediateInspection: 0,
      safetyRetention: 0,
    };
    if (sample.purpose === 'immediate_inspection') {
      quantities.immediateInspection += sample.quantity;
    } else if (sample.purpose === 'safety_retention') {
      quantities.safetyRetention += sample.quantity;
    }
    samplesByLot.set(sample.product_lot_id, quantities);
  }

  const qualitySamples = (sampleLots ?? []).flatMap((lot) => {
    const quantities = samplesByLot.get(lot.id);
    return quantities
      ? [{
          lotId: lot.id,
          lotNumber: lot.lot_number,
          productName: lot.products?.name ?? 'Producto terminado',
          immediateInspection: quantities.immediateInspection,
          safetyRetention: quantities.safetyRetention,
        }]
      : [];
  });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Nueva inspección</h1>
          <p className="text-sm text-gray-500">Registra la muestra, criterios y defectos observados.</p>
        </div>
        <Link href="/qa" className="rounded border px-4 py-2">Volver</Link>
      </div>
      <QualitySampleSummary samples={qualitySamples} />
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
