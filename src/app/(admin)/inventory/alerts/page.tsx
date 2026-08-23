import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { fetchInventoryAlerts } from '@/modules/inventory/application/inventory-alert-repository';

export default async function InventoryAlertsPage() {
  const supabase = await createTypedClient();
  const alerts = await fetchInventoryAlerts(supabase);

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Alertas de Inventario
      </h1>

      <div className="rounded-2xl border p-6">
        {alerts.length ? (
          <div className="space-y-3">
            {alerts.map(
              (
                item,
                index
              ) => {
                const critical =
                  item.quantity <=
                  0;

                return (
                  <div
                    key={index}
                    className="rounded border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {
                            item.name
                          }
                        </div>

                        <div className="text-sm text-gray-500">
                          {
                            item.internal_code
                          }
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          critical
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {critical
                          ? 'Crítico'
                          : 'Bajo mínimo'}
                      </span>
                    </div>

                    <div className="mt-4 text-sm">
                      Stock actual:{' '}
                      <strong>
                        {
                          item.quantity
                        }
                      </strong>
                    </div>

                    <div className="text-sm">
                      Stock mínimo:{' '}
                      <strong>
                        {
                          item.minimum
                        }
                      </strong>
                    </div>

                    <Link
                      href={`/inventory/kardex/${item.item_type}/${item.item_id}`}
                      className="mt-3 inline-block rounded border px-3 py-2 text-sm"
                    >
                      Ver Kardex
                    </Link>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay alertas de inventario.
          </p>
        )}
      </div>
    </main>
  );
}
