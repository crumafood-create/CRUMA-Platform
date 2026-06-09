import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import {
  InventoryMovementForm,
} from '@/app/(admin)/_components/inventory-movement-form';

import {
  createInventoryMovement,
} from '../actions';

export default async function NewInventoryMovementPage() {
  const supabase = await createClient();

  const { data: products } =
    await supabase
      .from('products')
      .select('id, name')
      .is('deleted_at', null)
      .order('name');

  const { data: locations } =
    await supabase
      .from('inventory_locations')
      .select('id, name')
      .is('deleted_at', null)
      .order('name');

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Movimiento Inventario
        </h1>

        <Link
          href="/inventory"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <InventoryMovementForm
        action={createInventoryMovement}
        products={products ?? []}
        locations={locations ?? []}
      />
    </main>
  );
}
