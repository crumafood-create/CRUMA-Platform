import { createClient } from '@/infrastructure/integrations/supabase/server';

type Product = {
  id: string;
  name: string;
  internal_code: string | null;
};

type RawMaterial = {
  id: string;
  name: string;
  internal_code: string | null;
};

export default async function InventoryAtpPage() {
  const supabase =
    await createClient();

  const { data: rows, error } =
    await supabase
      .from(
        'inventory_available_to_promise',
      )
      .select('*')
      .order(
        'item_type',
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const productIds =
    rows
      ?.filter(
        (
          row,
        ) =>
          row.item_type ===
          'product',
      )
      .map(
        (
          row,
        ) =>
          row.item_id,
      ) ?? [];

  const materialIds =
    rows
      ?.filter(
        (
          row,
        ) =>
          row.item_type ===
          'raw_material',
      )
      .map(
        (
          row,
        ) =>
          row.item_id,
      ) ?? [];

  const [
    { data: products },
    { data: materials },
  ] = await Promise.all([
    productIds.length
      ? supabase
          .from(
            'products',
          )
          .select(`
            id,
            name,
            internal_code
          `)
          .in(
            'id',
            productIds,
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
            name,
            internal_code
          `)
          .in(
            'id',
            materialIds,
          )
      : Promise.resolve({
          data: [],
        }),
  ]);

  const productMap =
    new Map(
      (
        products ??
        []
      ).map(
        (
          product: Product,
        ) => [
          product.id,
          product,
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
          material: RawMaterial,
        ) => [
          material.id,
          material,
        ],
      ),
    );

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">
          Inventario Disponible
        </h1>

        <p className="mt-2 text-gray-500">
          ATP
          (Available To Promise)
        </p>
      </div>

      <div className="rounded-2xl border p-6">
        {rows?.length ? (
          <div className="space-y-3">
            {rows.map(
              (
                row,
                index,
              ) => {
                const item =
                  row.item_type ===
                  'raw_material'
                    ? materialMap.get(
                        row.item_id,
                      )
                    : productMap.get(
                        row.item_id,
                      );

                return (
                  <div
                    key={
                      row.item_id ??
                      index
                    }
                    className="rounded border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {
                            item?.name
                          }
                        </div>

                        <div className="text-sm text-gray-500">
                          {
                            item?.internal_code
                          }
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.item_type ===
                          'raw_material'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {row.item_type ===
                        'raw_material'
                          ? 'Materia Prima'
                          : 'Producto'}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm text-gray-500">
                          Stock
                        </div>

                        <div className="text-xl font-bold">
                          {Number(
                            row.stock_quantity,
                          ).toFixed(
                            4,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">
                          Reservado
                        </div>

                        <div className="text-xl font-bold text-orange-600">
                          {Number(
                            row.reserved_quantity,
                          ).toFixed(
                            4,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">
                          Disponible
                        </div>

                        <div
                          className={`text-xl font-bold ${
                            Number(
                              row.available_quantity,
                            ) <= 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {Number(
                            row.available_quantity,
                          ).toFixed(
                            4,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay inventario.
          </p>
        )}
      </div>
    </main>
  );
}
