import { fetchInventoryLevels }
from '@/domains/inventory/services/inventory.service';

import { InventoryTable }
from '@/domains/inventory/components/inventory-table';

export default async function InventoryPage() {

  const inventory =
    await fetchInventoryLevels();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Inventario

        </h1>

      </div>

      <InventoryTable
        inventory={inventory}
      />

    </main>
  );
}
