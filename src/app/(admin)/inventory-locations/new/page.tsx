import Link from 'next/link';

import InventoryLocationForm from '@/app/(admin)/_components/inventory-location-form';

import { createInventoryLocation } from '../actions';

export default function NewInventoryLocationPage() {
  return (
    <main className="space-y-6">

      {/* ======================================================== */}
      {/* HEADER */}
      {/* ======================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Nueva Ubicación
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Registrar una nueva ubicación física del almacén.
          </p>

        </div>

        <Link
          href="/inventory-locations"
          className="rounded-lg border bg-white px-4 py-2 hover:bg-gray-50"
        >
          ← Volver
        </Link>

      </div>

      {/* ======================================================== */}
      {/* FORMULARIO */}
      {/* ======================================================== */}

      <InventoryLocationForm
        action={createInventoryLocation}
      />

    </main>
  );
}
