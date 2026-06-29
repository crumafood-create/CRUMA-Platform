import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type StockRow = {
  item_type: 'product' | 'raw_material';
  item_id: string;
  quantity: number;
};

type Product = {
  id: string;
  name: string;
  internal_code: string | null;
  min_stock: number | null;
};

type RawMaterial = {
  id: string;
  name: string;
  internal_code: string | null;
  minimum_stock: number | null;
};

export default async function InventoryAlertsPage() {
  const supabase = await createClient();

  const { data: stock } =
    await supabase
      .from('inventory_stock_by_item')
      .select(
        'item_type, item_id, quantity'
      );

  const productIds =
    stock
      ?.filter(
        (row) =>
          row.item_type ===
          'product'
      )
      .map((row) => row.item_id) ?? [];

  const materialIds =
    stock
      ?.filter(
        (row) =>
          row.item_type ===
          'raw_material'
      )
      .map((row) => row.item_id) ?? [];

  const [
    { data: products },
    { data: materials },
  ] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from('products')
          .select(`
            id,
            name,
            internal_code,
            min_stock
          `)
          .in('id', productIds)
      : Promise.resolve({
          data: [],
        }),

    materialIds.length > 0
      ? supabase
          .from('raw_materials')
          .select(`
            id,
            name,
            internal_code,
            minimum_stock
          `)
          .in('id', materialIds)
      : Promise.resolve({
          data: [],
        }),
  ]);

  const productMap = new Map(
    (products ?? []).map(
      (product: Product) => [
        product.id,
        product,
      ]
    )
  );

  const materialMap = new Map(
    (materials ?? []).map(
      (material: RawMaterial) => [
        material.id,
        material,
      ]
    )
  );

  const alerts =
    (stock ?? []).flatMap(
      (row: StockRow) => {
        if (
          row.item_type ===
          'product'
        ) {
          const product =
            productMap.get(
              row.item_id
            );

          if (!product) {
            return [];
          }

          const minimum =
            Number(
              product.min_stock ??
                0
            );

          if (
            row.quantity >
            minimum
          ) {
            return [];
          }

          return [
            {
              ...row,
              name:
                product.name,
              internal_code:
                product.internal_code,
              minimum,
            },
          ];
        }

        const material =
          materialMap.get(
            row.item_id
          );

        if (!material) {
          return [];
        }

        const minimum =
          Number(
            material.minimum_stock ??
              0
          );

        if (
          row.quantity >
          minimum
        ) {
          return [];
        }

        return [
          {
            ...row,
            name:
              material.name,
            internal_code:
              material.internal_code,
            minimum,
          },
        ];
      }
    );

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Alertas de Inventario
      </h1>

      <div className="rounded-2xl border p-6">
        {alerts.length ? (
          <div className="space-y-3">
            {alerts.map(
              (
                item,
                index
              ) => {
                const critical =
                  item.quantity <=
                  0;

                return (
                  <div
                    key={index}
                    className="rounded border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {
                            item.name
                          }
                        </div>

                        <div className="text-sm text-gray-500">
                          {
                            item.internal_code
                          }
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          critical
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {critical
                          ? 'Crítico'
                          : 'Bajo mínimo'}
                      </span>
                    </div>

                    <div className="mt-4 text-sm">
                      Stock actual:{' '}
                      <strong>
                        {
                          item.quantity
                        }
                      </strong>
                    </div>

                    <div className="text-sm">
                      Stock mínimo:{' '}
                      <strong>
                        {
                          item.minimum
                        }
                      </strong>
                    </div>

                    <Link
                      href={`/inventory/kardex/${item.item_type}/${item.item_id}`}
                      className="mt-3 inline-block rounded border px-3 py-2 text-sm"
                    >
                      Ver Kardex
                    </Link>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay alertas de inventario.
          </p>
        )}
      </div>
    </main>
  );
}
