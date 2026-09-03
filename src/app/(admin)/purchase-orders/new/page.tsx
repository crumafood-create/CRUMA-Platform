import Link from 'next/link';

import { PurchaseOrderForm } from '@/app/(admin)/_components/purchase-order-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { createPurchaseOrder } from '../actions';

export default async function NewPurchaseOrderPage() {
  const supabase = await createTypedClient();
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Nueva compra</h1>
        <Link href="/purchase-orders" className="rounded border px-4 py-2">
          Volver
        </Link>
      </header>
      <PurchaseOrderForm action={createPurchaseOrder} suppliers={suppliers ?? []} />
    </main>
  );
}
