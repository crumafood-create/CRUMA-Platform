import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { SalesOrderForm } from '@/app/(admin)/_components/sales-order-form';

import { createSalesOrder } from '../actions';

type Customer = {
  id: string;
  name: string;
};

export default async function NewSalesOrderPage() {
  const supabase =
    await createClient();

  const {
    data: customers,
  } = await supabase
    .from('customers')
    .select('id, name')
    .eq(
      'is_active',
      true,
    )
    .is(
      'deleted_at',
      null,
    )
    .order('name');

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Nuevo Pedido
        </h1>

        <Link
          href="/sales-orders"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <SalesOrderForm
        action={
          createSalesOrder
        }
        customers={
          (customers ??
            []) as Customer[]
        }
      />
    </main>
  );
}
