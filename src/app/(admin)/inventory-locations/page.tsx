import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function InventoryLocationsPage() {
  const supabase = await createClient();

  const { data: locations } =
    await supabase
      .from('inventory_locations')
      .select('*')
      .is('deleted_at', null)
      .order('name');

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Ubicaciones
        </h1>

        <Link
          href="/inventory-locations/new"
          className="rounded border px-4 py-2"
        >
          Nueva Ubicación
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {locations?.length ? (
          <div className="space-y-3">
            {locations.map(location => (
              <div
                key={location.id}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {location.name}
                </div>

                <div className="text-sm text-gray-500">
                  {location.slug}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>
            No hay ubicaciones.
          </p>
        )}
      </div>
    </main>
  );
}
