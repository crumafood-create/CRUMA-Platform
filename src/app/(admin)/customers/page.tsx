import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function CustomersPage() {
  const supabase =
    await createClient();

  const {
    data: customers,
    error,
  } = await supabase
    .from('customers')
    .select('*')
    .is(
      'deleted_at',
      null,
    )
    .order('name');

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Clientes
        </h1>

        <Link
          href="/customers/new"
          className="rounded border px-4 py-2"
        >
          Nuevo Cliente
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {customers?.length ? (
          <div className="space-y-3">
            {customers.map(
              (
                customer: any,
              ) => (
                <div
                  key={
                    customer.id
                  }
                  className="rounded border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {
                          customer.name
                        }
                      </div>

                      <div className="text-sm text-gray-500">
                        {
                          customer.customer_code
                        }
                      </div>

                      {customer.company_name && (
                        <div className="text-sm text-gray-500">
                          {
                            customer.company_name
                          }
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/customers/${customer.id}/edit`}
                      className="rounded border px-3 py-1"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <p>
            No hay
            clientes.
          </p>
        )}
      </div>
    </main>
  );
}
