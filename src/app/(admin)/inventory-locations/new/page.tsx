import Link from 'next/link';

import {
  InventoryLocationForm,
} from '@/app/(admin)/_components/inventory-location-form';

import {
  createInventoryLocation,
} from '../actions';

export default function NewInventoryLocationPage() {
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Nueva Ubicación
        </h1>

        <Link
          href="/inventory-locations"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <InventoryLocationForm
        action={
          createInventoryLocation
        }
      />
    </main>
  );
}
