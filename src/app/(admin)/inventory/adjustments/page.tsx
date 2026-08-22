import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function InventoryAdjustmentsPage() {
  const supabase =
    await createTypedClient();

  const { data: movements } =
    await supabase
      .from('inventory_movements')
      .select('*')
      .eq(
        'reference_type',
        'manual_adjustment'
      )
      .order('created_at', {
        ascending: false,
      });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Ajustes de Inventario
        </h1>

        <Link
          href="/inventory/adjustments/new"
          className="rounded border px-4 py-2"
        >
          Nuevo Ajuste
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {movements?.length ? (
          <div className="space-y-3">
            {movements.map(
              (movement) => (
                <div
                  key={movement.id}
                  className="rounded border p-4"
                >
                  <div className="font-semibold">
                    {movement.movement_type ===
                    'entry'
                      ? 'Entrada'
                      : movement.movement_type ===
                        'exit'
                      ? 'Salida'
                      : 'Ajuste'}
                  </div>

                  <div className="text-sm text-gray-500">
                    Tipo:{' '}
                    {
                      movement.item_type
                    }
                  </div>

                  <div className="text-sm text-gray-500">
                    Cantidad:{' '}
                    {
                      movement.quantity
                    }
                  </div>

                  <div className="text-sm text-gray-500">
                    {
                      movement.notes
                    }
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay ajustes registrados.
          </p>
        )}
      </div>
    </main>
  );
}
