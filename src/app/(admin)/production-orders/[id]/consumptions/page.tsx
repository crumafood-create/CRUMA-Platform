import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function ProductionConsumptionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const { data: order, error: orderError } = await supabase
    .from('production_orders')
    .select('id, production_number')
    .eq('id', id)
    .maybeSingle();

  if (orderError) throw new Error(orderError.message);
  if (!order) notFound();

  const { data: consumptions, error } = await supabase
    .from('production_order_consumptions')
    .select(`
      id,
      quantity,
      unit_cost,
      total_cost,
      created_at,
      raw_material_lots!production_order_consumptions_raw_material_lot_id_fkey(
        lot_number,
        expiration_date
      ),
      production_order_items!inner(
        production_order_id,
        raw_materials!production_order_items_raw_material_id_fkey(
          name,
          internal_code
        )
      )
    `)
    .eq('production_order_items.production_order_id', id)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Consumos de Lotes</h1>
          <p className="mt-1 text-sm text-gray-500">{order.production_number}</p>
        </div>
        <Link href={`/production-orders/${id}`} className="rounded border px-4 py-2">
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {consumptions?.length ? (
          <div className="space-y-4">
            {consumptions.map((consumption) => {
              const material = consumption.production_order_items?.raw_materials;
              const lot = consumption.raw_material_lots;

              return (
                <div key={consumption.id} className="rounded-lg border p-4">
                  <div className="font-semibold">{material?.name ?? 'Materia prima'}</div>
                  <div className="text-sm text-gray-500">{material?.internal_code ?? '-'}</div>
                  <div className="mt-3">
                    <span className="font-medium">Lote:</span> {lot?.lot_number ?? '-'}
                  </div>
                  <div>
                    <span className="font-medium">Consumido:</span> {consumption.quantity}
                  </div>
                  <div>
                    <span className="font-medium">Costo unitario:</span> ${Number(consumption.unit_cost).toFixed(4)} MXN
                  </div>
                  <div>
                    <span className="font-medium">Costo total:</span> ${Number(consumption.total_cost).toFixed(4)} MXN
                  </div>
                  {lot?.expiration_date && (
                    <div className="text-sm text-gray-500">
                      Caduca: {new Date(lot.expiration_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">Esta producción todavía no tiene consumos registrados.</p>
        )}
      </div>
    </main>
  );
}
