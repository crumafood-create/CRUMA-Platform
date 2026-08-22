import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function ProductionConsumptionsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase = await createTypedClient();

  const { data: order } =
    await supabase
      .from('production_orders')
      .select(`
        id,
        production_number
      `)
      .eq('id', id)
      .single();

  if (!order) {
    notFound();
  }

  const {
    data: consumptions,
    error,
  } = await supabase
    .from(
      'production_lot_consumptions'
    )
    .select(`
      id,
      quantity,
      raw_material_id,
      inventory_lot_id
    `)
    .eq(
      'production_order_id',
      id
    )
    .order(
      'created_at',
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  const materialIds =
    consumptions?.map(
      (item) =>
        item.raw_material_id
    ) ?? [];

  const lotIds =
    consumptions?.map(
      (item) =>
        item.inventory_lot_id
    ) ?? [];

  const [
    {
      data: materials,
    },
    {
      data: lots,
    },
  ] = await Promise.all([
    materialIds.length > 0
      ? supabase
          .from(
            'raw_materials'
          )
          .select(`
            id,
            name,
            internal_code
          `)
          .in(
            'id',
            materialIds
          )
      : Promise.resolve({
          data: [],
        }),

    lotIds.length > 0
      ? supabase
          .from(
            'inventory_lots'
          )
          .select(`
            id,
            lot_number,
            expiration_date
          `)
          .in(
            'id',
            lotIds
          )
      : Promise.resolve({
          data: [],
        }),
  ]);

  const materialMap =
    new Map(
      (
        materials ??
        []
      ).map(
        (
          material
        ) => [
          material.id,
          material,
        ]
      )
    );

  const lotMap =
    new Map(
      (
        lots ??
        []
      ).map(
        (lot) => [
          lot.id,
          lot,
        ]
      )
    );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Consumos de Lotes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {order.production_number}
          </p>
        </div>

        <Link
          href={`/production-orders/${id}`}
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {consumptions?.length ? (
          <div className="space-y-4">
            {consumptions.map(
              (
                consumption
              ) => {
                const material =
                  materialMap.get(
                    consumption.raw_material_id
                  );

                const lot =
                  lotMap.get(
                    consumption.inventory_lot_id
                  );

                return (
                  <div
                    key={
                      consumption.id
                    }
                    className="rounded-lg border p-4"
                  >
                    <div className="font-semibold">
                      {
                        material?.name
                      }
                    </div>

                    <div className="text-sm text-gray-500">
                      {
                        material?.internal_code
                      }
                    </div>

                    <div className="mt-3">
                      <span className="font-medium">
                        Lote:
                      </span>{' '}
                      {lot?.lot_number ??
                        '-'}
                    </div>

                    <div>
                      <span className="font-medium">
                        Consumido:
                      </span>{' '}
                      {
                        consumption.quantity
                      }
                    </div>

                    {lot?.expiration_date && (
                      <div className="text-sm text-gray-500">
                        Caduca:
                        {' '}
                        {new Date(
                          lot.expiration_date
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            Esta producción todavía no
            tiene consumos registrados.
          </p>
        )}
      </div>
    </main>
  );
}
