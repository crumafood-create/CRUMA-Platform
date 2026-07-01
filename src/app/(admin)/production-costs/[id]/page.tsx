import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function ProductionCostPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const {
    data: cost,
    error,
  } = await supabase
    .from(
      'production_costs',
    )
    .select('*')
    .eq(
      'production_order_id',
      id,
    )
    .single();

  if (error || !cost) {
    notFound();
  }

  const {
    data: order,
  } = await supabase
    .from(
      'production_orders',
    )
    .select(`
      id,
      production_number,
      produced_quantity
    `)
    .eq(
      'id',
      id,
    )
    .single();

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Costo de Producción
          </h1>

          <p className="mt-1 text-gray-500">
            {order?.production_number}
          </p>
        </div>

        <Link
          href="/production-costs"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6 space-y-6">
        <div>
          <div className="text-sm text-gray-500">
            Producción
          </div>

          <div className="text-2xl font-bold">
            {order?.produced_quantity ??
              0}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Materia Prima
          </div>

          <div className="text-2xl font-bold">
            $
            {Number(
              cost.material_cost,
            ).toFixed(
              2,
            )}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Mano de Obra
          </div>

          <div className="text-2xl font-bold">
            $
            {Number(
              cost.labor_cost,
            ).toFixed(
              2,
            )}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Costos Indirectos
          </div>

          <div className="text-2xl font-bold">
            $
            {Number(
              cost.overhead_cost,
            ).toFixed(
              2,
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="text-sm text-gray-500">
            Costo Total
          </div>

          <div className="text-3xl font-bold">
            $
            {Number(
              cost.total_cost,
            ).toFixed(
              2,
            )}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Costo Unitario
          </div>

          <div className="text-3xl font-bold text-green-700">
            $
            {Number(
              cost.unit_cost,
            ).toFixed(
              4,
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
