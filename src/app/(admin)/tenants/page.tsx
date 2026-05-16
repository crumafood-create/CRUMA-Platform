import { fetchTenants }
from '@/domains/tenant/services/tenant.service';

import { TenantsTable }
from '@/domains/tenant/components/tenants-table';

export default async function TenantsPage() {

  const tenants =
    await fetchTenants();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Tenants

        </h1>

      </div>

      <TenantsTable
        tenants={tenants}
      />

    </main>
  );
}
