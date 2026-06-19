import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function RawMaterialsPage() {
  const supabase = await createClient();

  const { data: materials } =
    await supabase
      .from('raw_materials')
      .select('*')
      .is('deleted_at', null)
      .order('name');

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Materias Primas
        </h1>

        <Link
          href="/raw-materials/new"
          className="rounded border px-4 py-2"
        >
          Nueva Materia Prima
        </Link>
      </div>

      <div className="rounded-2xl border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">
                Código
              </th>

              <th className="p-4 text-left">
                Nombre
              </th>

              <th className="p-4 text-left">
                Stock
              </th>

              <th className="p-4 text-left">
                Costo
              </th>

              <th className="p-4 text-right">
                Acción
              </th>
            </tr>
          </thead>

          <tbody>
            {materials?.map((material) => (
              <tr
                key={material.id}
                className="border-b"
              >
                <td className="p-4">
                  {material.internal_code}
                </td>

                <td className="p-4">
                  {material.name}
                </td>

                <td className="p-4">
                  {material.current_stock}
                </td>

                <td className="p-4">
                  ${material.average_cost}
                </td>

                <td className="p-4 text-right">
                  <Link
                    href={`/raw-materials/${material.id}/edit`}
                    className="rounded border px-3 py-1"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
