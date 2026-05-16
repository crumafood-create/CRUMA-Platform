import type { QAInspection }
from '../types/qa-inspection.type';

interface Props {

  inspections: QAInspection[];
}

export function QAInspectionsTable({
  inspections
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Batch

            </th>

            <th className="p-4 text-left">

              Estado

            </th>

            <th className="p-4 text-left">

              Inspector

            </th>

            <th className="p-4 text-left">

              Fecha

            </th>

          </tr>

        </thead>

        <tbody>

          {inspections.map(inspection => (

            <tr
              key={inspection.id}
              className="border-b"
            >

              <td className="p-4">

                {inspection.batch_code}

              </td>

              <td className="p-4">

                {inspection.status}

              </td>

              <td className="p-4">

                {inspection.inspector_name}

              </td>

              <td className="p-4">

                {inspection.created_at}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

