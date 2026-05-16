import { fetchB2BCustomers }
from '@/domains/b2b/services/b2b.service';

import { B2BCustomersTable }
from '@/domains/b2b/components/b2b-customers-table';

export default async function B2BPage() {

  const customers =
    await fetchB2BCustomers();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          B2B

        </h1>

      </div>

      <B2BCustomersTable
        customers={customers}
      />

    </main>
  );
}
