import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function ProductionCostsPage() {
  const supabase =
    await createClient();

  const { data: costs, error } =
    await supabase
      .from('production_costs')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  const orderIds =
    costs?.map(
      (row) =>
        row.production_order_id,
    ) ?? [];

  const { data: orders } =
    orderIds.length > 0
      ? await supabase
          .from(
            'production_orders',
          )
          .select(`
            id,
            production_number,
            produced_quantity
          `)
          .in(
            'id',
            orderIds,
          )
      : {
          data: [],
        };

  const orderMap =
    new Map(
      (orders ?? []).map(
        (order) => [
          order.id,
          order,
        ],
      ),
    );

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Costos de Producción
      </h1>

      <div className="rounded-2xl border p-6">
        {costs?.length ? (
          <div className="space-y-3">
            {costs.map(
              (cost) => {
                const order =
                  orderMap.get(
                    cost.production_order_id,
                  );

                return (
                  <div
                    key={cost.id}
                    className="rounded border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {order?.production_number ??
                            '-'}
                        </div>

                        <div className="text-sm text-gray-500">
                          Producción:{' '}
                          {order?.produced_quantity ??
                            0}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold">
                          $
                          {Number(
                            cost.total_cost,
                          ).toFixed(
                            2,
                          )}
                        </div>

                        <div className="text-sm text-gray-500">
                          Total
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/production-costs/${cost.production_order_id}`}
                      className="mt-4 inline-block rounded border px-3 py-2 text-sm"
                    >
                      Ver Detalle
                    </Link>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay costos calculados.
          </p>
        )}
      </div>
    </main>
  );
}
