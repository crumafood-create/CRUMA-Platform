import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function ProductionLotTracePage({
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
    data: order,
    error: orderError,
  } = await supabase
    .from(
      'production_orders',
    )
    .select(`
      id,
      production_number
    `)
    .eq(
      'id',
      id,
    )
    .single();

  if (
    orderError ||
    !order
  ) {
    notFound();
  }

  const {
    data: consumptions,
    error:
      consumptionsError,
  } = await supabase
    .from(
      'production_lot_consumptions',
    )
    .select(`
      id,
      quantity,
      inventory_lot_id,
      raw_material_id
    `)
    .eq(
      'production_order_id',
      id,
    );

  if (
    consumptionsError
  ) {
    throw new Error(
      consumptionsError.message,
    );
  }

  const lotIds =
    consumptions?.map(
      (
        row,
      ) =>
        row.inventory_lot_id,
    ) ?? [];

  const materialIds =
    consumptions?.map(
      (
        row,
      ) =>
        row.raw_material_id,
    ) ?? [];

  const [
    { data: lots },
    {
      data:
        materials,
    },
  ] = await Promise.all([
    lotIds.length
      ? supabase
          .from(
            'raw_material_lots',
          )
          .select(`
            id,
            lot_number
          `)
          .in(
            'id',
            lotIds,
          )
      : Promise.resolve({
          data: [],
        }),

    materialIds.length
      ? supabase
          .from(
            'raw_materials',
          )
          .select(`
            id,
            name
          `)
          .in(
            'id',
            materialIds,
          )
      : Promise.resolve({
          data: [],
        }),
  ]);

  const lotMap =
    new Map(
      (
        lots ??
        []
      ).map(
        (
          lot,
        ) => [
          lot.id,
          lot,
        ],
      ),
    );

  const materialMap =
    new Map(
      (
        materials ??
        []
      ).map(
        (
          material,
        ) => [
          material.id,
          material,
        ],
      ),
    );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Trazabilidad
          </h1>

          <p className="mt-1 text-gray-500">
            {
              order.production_number
            }
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
          <div className="space-y-3">
            {consumptions.map(
              (
                row,
              ) => {
                const lot =
                  lotMap.get(
                    row.inventory_lot_id,
                  );

                const material =
                  materialMap.get(
                    row.raw_material_id,
                  );

                return (
                  <div
                    key={
                      row.id
                    }
                    className="rounded border p-4"
                  >
                    <div className="font-semibold">
                      {material?.name ??
                        '-'}
                    </div>

                    <div className="text-sm text-gray-500">
                      Lote:{' '}
                      {lot?.lot_number ??
                        '-'}
                    </div>

                    <div className="mt-2 font-bold">
                      Consumido:{' '}
                      {Number(
                        row.quantity,
                      ).toFixed(
                        4,
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay consumos por lote.
          </p>
        )}
      </div>
    </main>
  );
}
