import type { DocumentFile }
from '../types/document.type';

interface Props {

  documents: DocumentFile[];
}

export function DocumentsTable({
  documents
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Documento

            </th>

            <th className="p-4 text-left">

              Categoría

            </th>

            <th className="p-4 text-left">

              Tipo

            </th>

            <th className="p-4 text-left">

              Fecha

            </th>

          </tr>

        </thead>

        <tbody>

          {documents.map(document => (

            <tr
              key={document.id}
              className="border-b"
            >

              <td className="p-4">

                {document.title}

              </td>

              <td className="p-4">

                {document.category}

              </td>

              <td className="p-4">

                {document.mime_type}

              </td>

              <td className="p-4">

                {document.created_at}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}
