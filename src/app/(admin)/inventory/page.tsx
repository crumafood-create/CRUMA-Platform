import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: stock } =
    await supabase
      .from('inventory_stock')
      .select(`
        *,
        products (
          name,
          internal_code
        ),
        inventory_locations (
          name
        )
      `)
      .order('updated_at', {
        ascending: false,
      });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Inventario
        </h1>

        <Link
          href="/inventory/new"
          className="rounded border px-4 py-2"
        >
          Nuevo Movimiento
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {stock?.length ? (
          <div className="space-y-3">
            {stock.map(item => (
              <div
                key={item.id}
                className="rounded-xl border p-4"
              >
                <div className="font-semibold">
                  {item.products?.name}
                </div>

                <div className="text-sm text-gray-500">
                  Código:
                  {' '}
                  {item.products?.internal_code}
                </div>

                <div className="text-sm text-gray-500">
                  Ubicación:
                  {' '}
                  {item.inventory_locations?.name}
                </div>

                <div className="mt-2 text-lg font-bold">
                  Existencia:
                  {' '}
                  {item.quantity}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>
            No hay existencias registradas.
          </p>
        )}
      </div>
    </main>
  );
}
