import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { normalizeCustomerFormValues } from '@/modules/sales/application/customer-contract';

import { CustomerForm } from '@/modules/customers/components/forms/customer-form';

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

  const supabase = await createTypedClient();

  const {
    data: customer,
  } = await supabase
    .from('customers')
    .select('id, customer_code, customer_type, name, company_name, tax_id, email, phone, mobile, address, city, state, postal_code, notes, credit_limit, is_active')
    .eq('id', id)
    .is('deleted_at', null)
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
          normalizeCustomerFormValues(customer)
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
