import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: stock, error: stockError } = await supabase
    .from('inventory_stock')
    .select('*')
    .order('quantity', {
      ascending: false,
    });

  if (stockError) {
    throw new Error(stockError.message);
  }

  const productIds =
    stock?.map((row) => row.product_id) ?? [];

  const { data: products, error: productsError } =
    await supabase
      .from('products')
      .select(`
        id,
        name,
        internal_code
      `)
      .in('id', productIds);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const productMap = new Map(
    (products ?? []).map((product) => [
      product.id,
      product,
    ]),
  );

  const inventoryRows = (stock ?? []).map((row) => ({
    quantity: row.quantity,
    product: productMap.get(row.product_id),
  }));

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Inventario Actual
        </h1>

        <Link
          href="/inventory/movements"
          className="rounded border px-4 py-2"
        >
          Movimientos
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left">
                Código
              </th>

              <th className="p-3 text-left">
                Producto
              </th>

              <th className="p-3 text-left">
                Stock
              </th>
            </tr>
          </thead>

          <tbody>
            {inventoryRows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="p-6 text-center text-gray-500"
                >
                  No hay inventario registrado
                </td>
              </tr>
            ) : (
              inventoryRows.map((item, index) => (
                <tr
                  key={item.product?.id ?? index}
                  className="border-b"
                >
                  <td className="p-3">
                    {item.product?.internal_code ?? '-'}
                  </td>

                  <td className="p-3">
                    {item.product?.name ??
                      'Producto sin nombre'}
                  </td>

                  <td className="p-3 font-semibold">
                    {item.quantity}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
