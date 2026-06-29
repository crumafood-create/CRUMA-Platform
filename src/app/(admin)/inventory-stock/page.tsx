import Link from 'next/link';

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

type StockRow = {
  item_type: 'product' | 'raw_material';
  item_id: string;
  quantity: number;
};

export default async function InventoryStockPage() {
  const supabase = await createClient();

  const { data: stock, error: stockError } =
    await supabase
      .from('inventory_stock_by_item')
      .select('*')
      .order('quantity', {
        ascending: false,
      });

  if (stockError) {
    throw new Error(stockError.message);
  }

  const typedStock = (stock ?? []) as StockRow[];

  const productIds =
    typedStock
      .filter((row) => row.item_type === 'product')
      .map((row) => row.item_id) ?? [];

  const materialIds =
    typedStock
      .filter((row) => row.item_type === 'raw_material')
      .map((row) => row.item_id) ?? [];

  const [
    { data: products },
    { data: materials },
  ] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from('products')
          .select(
            `
            id,
            name,
            internal_code
          `
          )
          .in('id', productIds)
      : Promise.resolve({ data: [] }),

    materialIds.length > 0
      ? supabase
          .from('raw_materials')
          .select(
            `
            id,
            name,
            internal_code
          `
          )
          .in('id', materialIds)
      : Promise.resolve({ data: [] }),
  ]);

  const productMap = new Map(
    (products ?? []).map((product: Product) => [
      product.id,
      product,
    ])
  );

  const materialMap = new Map(
    (materials ?? []).map((material: RawMaterial) => [
      material.id,
      material,
    ])
  );

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Stock Actual
      </h1>

      <div className="rounded-2xl border p-6">
        {typedStock.length > 0 ? (
          <div className="space-y-3">
            {typedStock.map((row, index) => {
              const item =
                row.item_type === 'raw_material'
                  ? materialMap.get(row.item_id)
                  : productMap.get(row.item_id);

              return (
                <div
                  key={row.item_id ?? index}
                  className="rounded border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {item?.name ?? '-'}
                      </div>

                      <div className="text-sm text-gray-500">
                        {item?.internal_code ?? '-'}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        row.item_type === 'raw_material'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {row.item_type === 'raw_material'
                        ? 'Materia Prima'
                        : 'Producto'}
                    </span>
                  </div>

                  <div className="mt-4 text-lg font-bold">
                    Stock: {row.quantity}
                  </div>

                  <Link
                    href={`/inventory/kardex/${row.item_type}/${row.item_id}`}
                    className="mt-3 inline-block rounded border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Ver Kardex
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay stock.
          </p>
        )}
      </div>
    </main>
  );
}
