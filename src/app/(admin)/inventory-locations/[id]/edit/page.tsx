import { notFound } from 'next/navigation';
import Link from 'next/link';

import InventoryLocationForm from '@/app/(admin)/_components/inventory-location-form';
import { createClient } from '@/infrastructure/integrations/supabase/server';

import {
  updateInventoryLocation,
  deleteInventoryLocation,
} from '../../actions';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditInventoryLocationPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: location, error } = await supabase
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
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!location) {
    notFound();
  }

  return (
    <main className="space-y-6">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Editar Ubicación
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {location.slug}
          </p>

        </div>

        <Link
          href="/inventory-locations"
          className="rounded-lg border bg-white px-4 py-2 hover:bg-gray-50"
        >
          ← Volver
        </Link>

      </div>

      {/* ===================================================== */}
      {/* FORM */}
      {/* ===================================================== */}

      <InventoryLocationForm
        location={location}
        action={updateInventoryLocation.bind(
          null,
          location.id,
        )}
      />

      {/* ===================================================== */}
      {/* ELIMINAR */}
      {/* ===================================================== */}

      <form
        action={deleteInventoryLocation.bind(
          null,
          location.id,
        )}
      >
        <button
          type="submit"
          className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
        >
          Eliminar ubicación
        </button>
      </form>

    </main>
  );
}
