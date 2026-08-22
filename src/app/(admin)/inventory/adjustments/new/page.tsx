import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { InventoryAdjustmentForm } from '@/app/(admin)/_components/inventory-adjustment-form';

import {
  createInventoryAdjustment,
} from '../actions';

export default async function NewInventoryAdjustmentPage() {
  const supabase =
    await createTypedClient();

  const [
    { data: products },
    { data: materials },
  ] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, internal_code'
      )
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('name'),

    supabase
      .from('raw_materials')
      .select(
        'id, name, internal_code'
      )
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name'),
  ]);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Nuevo Ajuste
        </h1>

        <Link
          href="/inventory/adjustments"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <InventoryAdjustmentForm
        action={createInventoryAdjustment}
        products={products ?? []}
        materials={materials ?? []}
      />
    </main>
  );
}
