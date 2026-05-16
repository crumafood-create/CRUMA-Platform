import { fetchQAInspections }
from '@/domains/qa/services/qa.service';

import { QAInspectionsTable }
from '@/domains/qa/components/qa-inspections-table';

export default async function QAPage() {

  const inspections =
    await fetchQAInspections();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          QA + Food Safety

        </h1>

      </div>

      <QAInspectionsTable
        inspections={inspections}
      />

    </main>
  );
}
