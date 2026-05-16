import { fetchCustomerProfiles }
from '@/domains/crm/services/crm.service';

import { CustomerProfilesTable }
from '@/domains/crm/components/customer-profiles-table';

export default async function CRMPage() {

  const customers =
    await fetchCustomerProfiles();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          CRM

        </h1>

      </div>

      <CustomerProfilesTable
        customers={customers}
      />

    </main>
  );
}
