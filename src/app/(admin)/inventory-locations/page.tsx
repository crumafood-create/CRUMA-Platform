import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type InventoryLocation = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  zone: string;
  aisle: number | null;
  rack: number | null;
  level: number | null;
  position: number | null;
  is_active: boolean;
};

export default async function InventoryLocationsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inventory_locations')
    .select(`
      id,
      slug,
      name,
      description,
      zone,
      aisle,
      rack,
      level,
      position,
      is_active
    `)
    .is('deleted_at', null)
    .order('zone')
    .order('aisle')
    .order('rack')
    .order('level')
    .order('position');

  if (error) {
    throw new Error(error.message);
  }

  const locations: InventoryLocation[] = data ?? [];

  return (
    <main className="space-y-6">

      {/* ======================================================== */}
      {/* HEADER */}
      {/* ======================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Ubicaciones
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Administración de ubicaciones físicas del almacén
          </p>

        </div>

        <Link
          href="/inventory-locations/new"
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Nueva ubicación
        </Link>

      </div>

      {/* ======================================================== */}
      {/* TABLA */}
      {/* ======================================================== */}

      <div className="overflow-hidden rounded-2xl border bg-white">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr className="text-left text-sm">

              <th className="px-5 py-4">
                Código
              </th>

              <th className="px-5 py-4">
                Nombre
              </th>

              <th className="px-5 py-4">
                Zona
              </th>

              <th className="px-5 py-4">
                Pasillo
              </th>

              <th className="px-5 py-4">
                Rack
              </th>

              <th className="px-5 py-4">
                Nivel
              </th>

              <th className="px-5 py-4">
                Posición
              </th>

              <th className="px-5 py-4">
                Estado
              </th>

              <th className="px-5 py-4 text-right">
                Acciones
              </th>

            </tr>

          </thead>

          <tbody>

            {locations.length === 0 && (

              <tr>

                <td
                  colSpan={9}
                  className="py-12 text-center text-gray-500"
                >
                  No existen ubicaciones registradas.
                </td>

              </tr>

            )}

            {locations.map((location) => (

              <tr
                key={location.id}
                className="border-t hover:bg-gray-50"
              >

                <td className="px-5 py-4 font-mono font-semibold">
                  {location.slug}
                </td>

                <td className="px-5 py-4">

                  <div className="font-medium">
                    {location.name}
                  </div>

                  {location.description && (

                    <div className="text-xs text-gray-500">
                      {location.description}
                    </div>

                  )}

                </td>

                <td className="px-5 py-4">
                  {location.zone}
                </td>

                <td className="px-5 py-4">
                  {location.aisle}
                </td>

                <td className="px-5 py-4">
                  {location.rack}
                </td>

                <td className="px-5 py-4">
                  {location.level}
                </td>

                <td className="px-5 py-4">
                  {location.position}
                </td>

                <td className="px-5 py-4">

                  {location.is_active ? (

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Activa
                    </span>

                  ) : (

                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      Inactiva
                    </span>

                  )}

                </td>

                <td className="px-5 py-4 text-right">

                  <Link
                    href={`/inventory-locations/${location.id}/edit`}
                    className="rounded-lg border px-4 py-2 hover:bg-gray-100"
                  >
                    Editar
                  </Link>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}
