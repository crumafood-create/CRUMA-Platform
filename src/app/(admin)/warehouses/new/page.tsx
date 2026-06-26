import { WarehouseForm } from '@/app/(admin)/_components/warehouse-form';

import { createWarehouse } from '../actions';

export default function NewWarehousePage() {
  return (
    <main className="space-y-6">
      <div>
        <a
          href="/warehouses"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Volver a Almacenes
        </a>

        <h1 className="mt-2 text-4xl font-bold">
          Nuevo Almacén
        </h1>
      </div>

      <WarehouseForm action={createWarehouse} />
    </main>
  );
}
