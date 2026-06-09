import Link from 'next/link';

import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function ProductInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: product } =
    await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

  if (!product) {
    notFound();
  }

  const { data: movements } =
    await supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_locations (
          name
        )
      `)
      .eq('product_id', id)
      .order('created_at', {
        ascending: true,
      });

  let stock = 0;

  const rows =
    movements?.map(movement => {
      stock +=
        movement.movement_type === 'entry'
          ? movement.quantity
          : -movement.quantity;

      return {
        ...movement,
        balance: stock,
      };
    }) ?? [];

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
                  {row.inventory_locations?.name}
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
