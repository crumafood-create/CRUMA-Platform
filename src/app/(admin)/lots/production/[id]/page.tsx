import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function ProductionLotTracePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const { data: order, error } = await supabase.from('production_orders')
    .select('id, production_number').eq('id', id).maybeSingle();
  if (error) throw new Error('No fue posible consultar la orden.');
  if (!order) notFound();

  const [
    { data: lots, error: lotsError },
    { data: consumptions, error: consumptionsError },
  ] = await Promise.all([
    supabase.from('product_lots').select(`
      id, lot_number, initial_quantity, quantity, status, expiration_date,
      products(name)
    `).eq('production_order_id', id).order('created_at'),
    supabase.from('production_order_consumptions').select(`
      id, quantity, unit_cost, total_cost,
      raw_material_lots(lot_number),
      production_order_items!inner(
        production_order_id,
        raw_materials(name)
      )
    `).eq('production_order_items.production_order_id', id).order('created_at'),
  ]);

  if (lotsError) throw new Error('No fue posible consultar los lotes producidos.');
  if (consumptionsError) throw new Error('No fue posible consultar los consumos de materias primas.');

  const outputLotIds = (lots ?? []).map((lot) => lot.id);
  const { data: reusedSurpluses, error: reusedSurplusesError } = outputLotIds.length
    ? await supabase
        .from('production_order_product_lot_reservations')
        .select('product_lot_id, surplus_quantity, surplus_destination_product_lot_id')
        .eq('surplus_disposition', 'reuse')
        .in('surplus_destination_product_lot_id', outputLotIds)
    : { data: [], error: null };

  if (reusedSurplusesError) throw new Error('No fue posible consultar la trazabilidad de sobrantes reutilizados.');

  const sourceLotIds = [...new Set((reusedSurpluses ?? []).map((row) => row.product_lot_id))];
  const { data: sourceLots, error: sourceLotsError } = sourceLotIds.length
    ? await supabase
        .from('product_lots')
        .select('id, lot_number')
        .in('id', sourceLotIds)
    : { data: [], error: null };

  if (sourceLotsError) throw new Error('No fue posible consultar los lotes de origen de sobrantes.');

  const sourceLotById = new Map((sourceLots ?? []).map((lot) => [lot.id, lot]));
  const outputLotById = new Map((lots ?? []).map((lot) => [lot.id, lot]));

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-4xl font-bold">Trazabilidad</h1>
          <p className="text-gray-500">{order.production_number}</p></div>
        <Link href={`/production-orders/${id}`} className="rounded border px-4 py-2">Volver</Link>
      </div>
      <section className="space-y-3 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">Lotes producidos</h2>
        {lots?.length ? lots.map((lot) => (
          <div key={lot.id} className="grid gap-2 rounded border p-4 md:grid-cols-4">
            <strong>{lot.lot_number}</strong>
            <span>{lot.products?.name ?? '-'}</span>
            <span>{lot.quantity} de {lot.initial_quantity}</span>
            <span>{lot.status} · caduca {lot.expiration_date ?? '-'}</span>
          </div>
        )) : <p className="text-gray-500">No hay lotes liberados.</p>}
      </section>
      <section className="space-y-3 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">Sobrantes de masa reutilizados</h2>
        {reusedSurpluses?.length ? reusedSurpluses.map((surplus) => (
          <div key={`${surplus.product_lot_id}-${surplus.surplus_destination_product_lot_id}`} className="grid gap-2 rounded border p-4 md:grid-cols-3">
            <strong>Lote de origen {sourceLotById.get(surplus.product_lot_id)?.lot_number ?? '-'}</strong>
            <span>{Number(surplus.surplus_quantity).toFixed(4)} kg incorporados</span>
            <span>Lote nuevo {outputLotById.get(surplus.surplus_destination_product_lot_id ?? '')?.lot_number ?? '-'}</span>
          </div>
        )) : <p className="text-gray-500">No hay sobrantes de masa reutilizados en esta orden.</p>}
      </section>
      <section className="space-y-3 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">Materias primas consumidas</h2>
        {consumptions?.length ? consumptions.map((item) => (
          <div key={item.id} className="grid gap-2 rounded border p-4 md:grid-cols-4">
            <strong>{item.production_order_items?.raw_materials?.name ?? '-'}</strong>
            <span>Lote {item.raw_material_lots?.lot_number ?? '-'}</span>
            <span>{item.quantity} unidades</span>
            <span>Costo {Number(item.total_cost).toFixed(2)}</span>
          </div>
        )) : <p className="text-gray-500">No hay consumos registrados.</p>}
      </section>
    </main>
  );
}
