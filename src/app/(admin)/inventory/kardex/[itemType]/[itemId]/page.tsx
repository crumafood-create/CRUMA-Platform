import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type Params = {
  params: Promise<{
    itemType: string;
    itemId: string;
  }>;
};

export default async function KardexPage({
  params,
}: Params) {
  const {
    itemType,
    itemId,
  } = await params;

  const supabase =
    await createClient();

  const {
    data: movements,
    error,
  } = await supabase
    .from('inventory_movements')
    .select(`
      id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      notes,
      created_at
    `)
    .eq(
      'item_type',
      itemType
    )
    .eq(
      'item_id',
      itemId
    )
    .order(
      'created_at',
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  let itemName = '-';
  let internalCode = '-';

  if (
    itemType ===
    'raw_material'
  ) {
    const { data } =
      await supabase
        .from(
          'raw_materials'
        )
        .select(
          'name, internal_code'
        )
        .eq(
          'id',
          itemId
        )
        .single();

    if (!data) {
      notFound();
    }

    itemName = data.name;
    internalCode =
      data.internal_code ??
      '-';
  }

  if (
    itemType ===
    'product'
  ) {
    const { data } =
      await supabase
        .from('products')
        .select(
          'name, internal_code'
        )
        .eq(
          'id',
          itemId
        )
        .single();

    if (!data) {
      notFound();
    }

    itemName = data.name;
    internalCode =
      data.internal_code ??
      '-';
  }

  let runningStock = 0;

  const rows =
    (
      movements ?? []
    ).map(
      (movement) => {
        const quantity =
          Number(
            movement.quantity
          );

        if (
          movement.movement_type ===
          'entry'
        ) {
          runningStock +=
            quantity;
        } else {
          runningStock -=
            quantity;
        }

        return {
          ...movement,
          stock:
            runningStock,
        };
      }
    );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Kardex
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {itemName}
          </p>

          <p className="text-sm text-gray-500">
            {internalCode}
          </p>
        </div>

        <Link
          href="/inventory-stock"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        {rows.length ? (
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
              {rows.map(
                (
                  movement
                ) => (
                  <tr
                    key={
                      movement.id
                    }
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
                        : 'Salida'}
                    </td>

                    <td className="p-4">
                      {
                        movement.quantity
                      }
                    </td>

                    <td className="p-4 font-semibold">
                      {
                        movement.stock
                      }
                    </td>

                    <td className="p-4">
                      {
                        movement.reference_type
                      }
                    </td>

                    <td className="p-4">
                      {movement.notes ??
                        '-'}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-gray-500">
            No hay movimientos.
          </div>
        )}
      </div>
    </main>
  );
}
