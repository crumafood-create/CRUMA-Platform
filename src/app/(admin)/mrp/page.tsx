import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function MrpPage() {
  const supabase =
    await createClient();

  const {
    data: requirements,
  } = await supabase
    .from(
      'mrp_requirements',
    )
    .select('*')
    .order(
      'raw_material_name',
    );

  const materialIds =
    requirements?.map(
      (
        row,
      ) =>
        row.raw_material_id,
    ) ?? [];

  const {
    data: stock,
  } =
    materialIds.length
      ? await supabase
          .from(
            'inventory_stock_by_item',
          )
          .select(`
            item_id,
            quantity
          `)
          .eq(
            'item_type',
            'raw_material',
          )
          .in(
            'item_id',
            materialIds,
          )
      : {
          data: [],
        };

  const stockMap =
    new Map(
      (
        stock ?? []
      ).map(
        (
          row,
        ) => [
          row.item_id,
          Number(
            row.quantity,
          ),
        ],
      ),
    );

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">
          Planeación de Materiales
        </h1>

        <p className="mt-2 text-gray-500">
          Materias primas
          requeridas para
          producción activa
        </p>
      </div>

      <div className="rounded-2xl border p-6">
        {requirements?.length ? (
          <div className="space-y-3">
            {requirements.map(
              (
                row: any,
              ) => {
                const required =
                  Number(
                    row.required_quantity,
                  );

                const available =
                  stockMap.get(
                    row.raw_material_id,
                  ) ?? 0;

                const shortage =
                  Math.max(
                    required -
                      available,
                    0,
                  );

                return (
                  <div
                    key={
                      row.raw_material_id
                    }
                    className="rounded border p-4"
                  >
                    <div className="font-semibold">
                      {
                        row.raw_material_name
                      }
                    </div>

                    <div className="mt-2 text-sm">
                      Requerido:{' '}
                      {required.toFixed(
                        4,
                      )}
                    </div>

                    <div className="text-sm">
                      Disponible:{' '}
                      {available.toFixed(
                        4,
                      )}
                    </div>

                    <div
                      className={`mt-2 font-semibold ${
                        shortage >
                        0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {shortage >
                      0
                        ? `Comprar ${shortage.toFixed(
                            4,
                          )}`
                        : 'Stock suficiente'}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay producción
            activa.
          </p>
        )}
      </div>
    </main>
  );
}
