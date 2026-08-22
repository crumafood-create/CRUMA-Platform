import Link from 'next/link';

import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { calculateInventoryBalances } from '@/modules/inventory/application/inventory-movement-contract';

export default async function ProductInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createTypedClient();

  const { data: product } =
    await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

  if (!product) {
    notFound();
  }

  const { data: movements, error: movementsError } =
    await supabase
      .from('inventory_movements')
      .select('id, created_at, movement_type, quantity, warehouse_id')
      .eq('product_id', id)
      .order('created_at', {
        ascending: true,
      });

  if (movementsError) {
    throw new Error(movementsError.message);
  }

  const warehouseIds = Array.from(
    new Set(
      (movements ?? [])
        .map((movement) => movement.warehouse_id)
        .filter((warehouseId): warehouseId is string => warehouseId !== null),
    ),
  );

  const { data: warehouses, error: warehousesError } = warehouseIds.length
    ? await supabase
        .from('warehouses')
        .select('id, name')
        .in('id', warehouseIds)
    : { data: [], error: null };

  if (warehousesError) {
    throw new Error(warehousesError.message);
  }

  const warehouseNames = new Map(
    (warehouses ?? []).map((warehouse) => [warehouse.id, warehouse.name]),
  );
  const rows = calculateInventoryBalances(movements ?? []);
  const stock = rows.at(-1)?.balance ?? 0;

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Kardex
        </h1>

        <Link
          href="/products"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">
          {product.name}
        </h2>

        <p className="mt-2 text-gray-500">
          Stock actual:
          {' '}
          {stock}
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left">
                Fecha
              </th>

              <th className="p-3 text-left">
                Tipo
              </th>

              <th className="p-3 text-left">
                Cantidad
              </th>

              <th className="p-3 text-left">
                Ubicación
              </th>

              <th className="p-3 text-left">
                Saldo
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                className="border-b"
              >
                <td className="p-3">
                  {new Date(
                    row.created_at
                  ).toLocaleDateString()}
                </td>

                <td className="p-3">
                  {row.movement_type === 'entry'
                    ? 'Entrada'
                    : 'Salida'}
                </td>

                <td className="p-3">
                  {row.quantity}
                </td>

                <td className="p-3">
                  {row.warehouse_id ? warehouseNames.get(row.warehouse_id) ?? '-' : '-'}
                </td>

                <td className="p-3 font-semibold">
                  {row.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
