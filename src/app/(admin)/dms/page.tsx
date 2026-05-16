import { fetchDocuments }
from '@/domains/dms/services/dms.service';

import { DocumentsTable }
from '@/domains/dms/components/documents-table';

export default async function DMSPage() {

  const documents =
    await fetchDocuments();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          DMS

        </h1>

      </div>

      <DocumentsTable
        documents={documents}
      />

    </main>
  );
}
