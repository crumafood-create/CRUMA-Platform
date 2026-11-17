import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { recordProductLotQualitySampleInspection } from '../../../actions';
import { QualityInspectionForm } from '@/modules/quality/components/forms/quality-inspection-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function InspectProductLotQualitySamplePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const { data: sample, error: sampleError } = await supabase
    .from('product_lot_quality_samples')
    .select('id, product_lot_id, purpose, quantity, status')
    .eq('id', id)
    .maybeSingle();

  if (sampleError) {
    throw new Error('No fue posible consultar la muestra de Calidad.');
  }
  if (!sample) notFound();
  if (sample.purpose !== 'immediate_inspection' || sample.status !== 'pending_inspection') {
    redirect('/qa/create');
  }

  const { data: lot, error: lotError } = await supabase
    .from('product_lots')
    .select('id, lot_number, product_id, production_order_id')
    .eq('id', sample.product_lot_id)
    .maybeSingle();
  if (lotError) throw new Error('No fue posible consultar el lote de la muestra.');
  if (!lot) notFound();

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('name')
    .eq('id', lot.product_id)
    .maybeSingle();
  if (productError) {
    throw new Error('No fue posible consultar el origen de la muestra.');
  }

  let productionNumber: string | null = null;
  if (lot.production_order_id) {
    const { data: order, error: orderError } = await supabase
      .from('production_orders')
      .select('production_number')
      .eq('id', lot.production_order_id)
      .maybeSingle();
    if (orderError) {
      throw new Error('No fue posible consultar la orden de origen.');
    }
    productionNumber = order?.production_number ?? null;
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Inspeccionar muestra de producto congelado</h1>
          <p className="text-sm text-gray-500">
            {product?.name ?? 'Producto terminado'} · lote {lot.lot_number}
            {productionNumber ? ` · orden ${productionNumber}` : ''}
          </p>
        </div>
        <Link href="/qa/create" className="rounded border px-4 py-2">Volver</Link>
      </header>

      <p className="text-sm text-gray-600">
        La cantidad queda apartada hasta registrar su destino después de la inspección.
      </p>

      <QualityInspectionForm
        action={recordProductLotQualitySampleInspection}
        outputs={[]}
        sample={{
          id: sample.id,
          label: `${product?.name ?? 'Producto terminado'} · lote ${lot.lot_number}`,
          quantity: sample.quantity,
        }}
      />
    </main>
  );
}
