import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: inventory = [], error } = await supabase
    .from('inventory_stock')
    .select(`
      quantity,
      products (
        id,
        name,
        internal_code
      )
    `)
    .order('quantity', {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

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
            {inventory.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="p-6 text-center text-gray-500"
                >
                  No hay inventario registrado
                </td>
              </tr>
            ) : (
              inventory.map((item: any) => (
                <tr
                  key={item.products?.id}
                  className="border-b"
                >
                  <td className="p-3">
                    {item.products?.internal_code}
                  </td>

                  <td className="p-3">
                    {item.products?.name}
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
