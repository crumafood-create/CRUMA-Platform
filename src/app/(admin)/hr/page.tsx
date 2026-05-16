import { fetchEmployees }
from '@/domains/hr/services/hr.service';

import { EmployeesTable }
from '@/domains/hr/components/employees-table';

export default async function HRPage() {

  const employees =
    await fetchEmployees();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Recursos Humanos

        </h1>

      </div>

      <EmployeesTable
        employees={employees}
      />

    </main>
  );
}
