import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { PurchaseOrderForm } from '@/app/(admin)/_components/purchase-order-form';

import {
  createPurchaseOrder,
} from '../actions';

type Supplier = {
  id: string;
  name: string;
};

export default async function NewPurchaseOrderPage() {
  const supabase = await createClient();

  const { data: suppliers } =
    await supabase
      .from('suppliers')
      .select('id, name')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name');

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Nueva Compra
        </h1>

        <Link
          href="/purchase-orders"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <PurchaseOrderForm
        action={createPurchaseOrder}
        suppliers={
          (suppliers ??
            []) as Supplier[]
        }
      />
    </main>
  );
}
