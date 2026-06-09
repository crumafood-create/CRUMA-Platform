import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('inventory_movements')
    .select(`
      quantity,
      movement_type,
      products (
        id,
        name
      ),
      inventory_locations (
        id,
        name
      )
    `);

  const inventoryMap = new Map();

  data?.forEach((movement: any) => {
    const productName =
      movement.products?.name;

    const locationName =
      movement.inventory_locations?.name;

    const key =
      `${productName}-${locationName}`;

    const current =
      inventoryMap.get(key) ?? 0;

    const qty =
      movement.movement_type === 'entry'
        ? movement.quantity
        : -movement.quantity;

    inventoryMap.set(
      key,
      current + qty
    );
  });

  const inventory =
    Array.from(
      inventoryMap.entries()
    ).map(([key, stock]) => {
      const [
        product,
        location,
      ] = key.split('-');

      return {
        product,
        location,
        stock,
      };
    });

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Inventario Actual
      </h1>

      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left">
                Producto
              </th>

              <th className="p-3 text-left">
                Ubicación
              </th>

              <th className="p-3 text-left">
                Stock
              </th>
            </tr>
          </thead>

          <tbody>
            {inventory.map(row => (
              <tr
                key={`${row.product}-${row.location}`}
                className="border-b"
              >
                <td className="p-3">
                  {row.product}
                </td>

                <td className="p-3">
                  {row.location}
                </td>

                <td className="p-3 font-semibold">
                  {row.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
