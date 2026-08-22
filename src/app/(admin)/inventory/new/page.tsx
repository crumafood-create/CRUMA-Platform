import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { InventoryMovementForm } from '@/app/(admin)/_components/inventory-movement-form';

import { createInventoryMovement } from '../actions';

export default async function NewInventoryMovementPage() {
  const supabase = await createTypedClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .is('deleted_at', null)
    .order('name');

  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('id, name')
    .eq('is_active', true)
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
        warehouses={warehouses ?? []}
      />
    </main>
  );
}
