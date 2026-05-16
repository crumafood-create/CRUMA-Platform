import { fetchSuppliers }
from '@/domains/procurement/services/procurement.service';

import { SuppliersTable }
from '@/domains/procurement/components/suppliers-table';

export default async function ProcurementPage() {

  const suppliers =
    await fetchSuppliers();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Procurement

        </h1>

      </div>

      <SuppliersTable
        suppliers={suppliers}
      />

    </main>
  );
}
