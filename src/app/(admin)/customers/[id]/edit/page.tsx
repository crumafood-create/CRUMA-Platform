import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { CustomerForm } from '@/app/(admin)/_components/customer-form';

import {
  updateCustomer,
  deleteCustomer,
} from '../../actions';

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const {
    data: customer,
  } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (!customer) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Cliente
      </h1>

      <CustomerForm
        initialValues={
          customer
        }
        action={updateCustomer.bind(
          null,
          customer.id,
        )}
      />

      <form
        action={deleteCustomer.bind(
          null,
          customer.id,
        )}
      >
        <button
          type="submit"
          className="rounded border border-red-300 px-4 py-2 text-red-700"
        >
          Eliminar
        </button>
      </form>
    </main>
  );
}
