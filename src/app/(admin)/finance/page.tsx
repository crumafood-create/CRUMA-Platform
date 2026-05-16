import { fetchInvoices }
from '@/domains/finance/services/finance.service';

import { InvoicesTable }
from '@/domains/finance/components/invoices-table';

export default async function FinancePage() {

  const invoices =
    await fetchInvoices();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Finanzas

        </h1>

      </div>

      <InvoicesTable
        invoices={invoices}
      />

    </main>
  );
}
