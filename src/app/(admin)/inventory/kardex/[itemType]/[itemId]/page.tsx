import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type Params = {
  params: Promise<{
    itemType: string;
    itemId: string;
  }>;
};

type Movement = {
  id: string;
  item_type: 'product' | 'raw_material';
  item_id: string;
  movement_type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
};

export default async function KardexPage({
  params,
}: Params) {
  const { itemType, itemId } = await params;

  const supabase = await createClient();

  let itemName = '-';
  let internalCode = '-';

  if (itemType === 'product') {
    const { data: product } = await supabase
      .from('products')
      .select(`
        name,
        internal_code
      `)
      .eq('id', itemId)
      .single();

    if (!product) {
      notFound();
    }

    itemName = product.name;
    internalCode =
      product.internal_code ?? '-';
  }

  if (itemType === 'raw_material') {
    const { data: material } = await supabase
      .from('raw_materials')
      .select(`
        name,
        internal_code
      `)
      .eq('id', itemId)
      .single();

    if (!material) {
      notFound();
    }

    itemName = material.name;
    internalCode =
      material.internal_code ?? '-';
  }

  const {
    data: movements,
    error,
  } = await supabase
    .from('inventory_movements')
    .select(`
      id,
      item_type,
      item_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      notes,
      created_at
    `)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .order('created_at', {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  let runningStock = 0;

  const rows = (
    (movements ?? []) as Movement[]
  ).map((movement) => {
    const quantity =
      Number(movement.quantity);

    if (
      movement.movement_type ===
      'entry'
    ) {
      runningStock += quantity;
    } else if (
      movement.movement_type ===
      'exit'
    ) {
      runningStock -= quantity;
    }

    return {
      ...movement,
      stock: runningStock,
    };
  });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Kardex
          </h1>

          <p className="mt-2 text-lg font-semibold">
            {itemName}
          </p>

          <p className="text-sm text-gray-500">
            {internalCode}
          </p>

          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              itemType === 'raw_material'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {itemType === 'raw_material'
              ? 'Materia Prima'
              : 'Producto'}
          </span>
        </div>

        <Link
          href="/inventory-stock"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        {rows.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 text-left">
                  Fecha
                </th>

                <th className="p-4 text-left">
                  Movimiento
                </th>

                <th className="p-4 text-left">
                  Cantidad
                </th>

                <th className="p-4 text-left">
                  Stock
                </th>

                <th className="p-4 text-left">
                  Referencia
                </th>

                <th className="p-4 text-left">
                  Notas
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((movement) => (
                <tr
                  key={movement.id}
                  className="border-b"
                >
                  <td className="p-4">
                    {new Date(
                      movement.created_at
                    ).toLocaleString()}
                  </td>

                  <td className="p-4">
                    {movement.movement_type ===
                    'entry'
                      ? 'Entrada'
                      : movement.movement_type ===
                        'exit'
                      ? 'Salida'
                      : 'Ajuste'}
                  </td>

                  <td className="p-4">
                    {movement.quantity}
                  </td>

                  <td className="p-4 font-semibold">
                    {movement.stock}
                  </td>

                  <td className="p-4">
                    {movement.reference_type ??
                      '-'}
                  </td>

                  <td className="p-4">
                    {movement.notes ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-gray-500">
            No hay movimientos registrados.
          </div>
        )}
      </div>
    </main>
  );
}
