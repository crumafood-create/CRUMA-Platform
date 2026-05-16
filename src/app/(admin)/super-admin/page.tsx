import { fetchGlobalUsers }
from '@/domains/super-admin/services/super-admin.service';

import { GlobalUsersTable }
from '@/domains/super-admin/components/global-users-table';

export default async function SuperAdminPage() {

  const users =
    await fetchGlobalUsers();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Super Admin

        </h1>

      </div>

      <GlobalUsersTable
        users={users}
      />

    </main>
  );
}
