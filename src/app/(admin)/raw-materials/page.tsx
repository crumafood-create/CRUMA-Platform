import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type RawMaterial = {
  id: string;
  name: string;
  internal_code: string | null;
  current_stock: number | null;
  average_cost: number | null;
  unit_of_measure_id: string | null;
  is_active: boolean | null;
};

type UnitOfMeasure = {
  id: string;
  name: string;
  code: string;
};

export default async function RawMaterialsPage() {
  const supabase = await createClient();

  const [
    { data: materials, error: materialsError },
    { data: units },
  ] = await Promise.all([
    supabase
      .from('raw_materials')
      .select(
        'id, name, internal_code, current_stock, average_cost, unit_of_measure_id, is_active'
      )
      .is('deleted_at', null)
      .order('name'),

    supabase
      .from('units_of_measure')
      .select('id, name, code')
      .eq('is_active', true),
  ]);

  if (materialsError) {
    return (
      <main className="space-y-6">
        <h1 className="text-4xl font-bold">
          Materias Primas
        </h1>

        <div className="rounded-2xl border p-6">
          <p className="text-red-600">
            Error al cargar materias primas.
          </p>

          <pre className="mt-4 whitespace-pre-wrap rounded border bg-gray-50 p-4 text-xs">
            {JSON.stringify(materialsError, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const unitMap = new Map(
    (units ?? []).map((unit: UnitOfMeasure) => [
      unit.id,
      `${unit.code} - ${unit.name}`,
    ])
  );

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

      <div className="overflow-hidden rounded-2xl border">
        {materials?.length ? (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 text-left">Código</th>
                <th className="p-4 text-left">Nombre</th>
                <th className="p-4 text-left">Unidad</th>
                <th className="p-4 text-left">Stock</th>
                <th className="p-4 text-left">
                  Costo Promedio
                </th>
                <th className="p-4 text-left">Estado</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>

            <tbody>
              {materials.map((material: RawMaterial) => (
                <tr key={material.id} className="border-b">
                  <td className="p-4">
                    {material.internal_code ?? '-'}
                  </td>

                  <td className="p-4 font-medium">
                    {material.name}
                  </td>

                  <td className="p-4">
                    {material.unit_of_measure_id
                      ? unitMap.get(material.unit_of_measure_id) ??
                        '-'
                      : '-'}
                  </td>

                  <td className="p-4">
                    {material.current_stock ?? 0}
                  </td>

                  <td className="p-4">
                    $
                    {Number(
                      material.average_cost ?? 0
                    ).toFixed(2)}
                  </td>

                  <td className="p-4">
                    {material.is_active
                      ? 'Activo'
                      : 'Inactivo'}
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
        ) : (
          <div className="p-6 text-gray-500">
            No hay materias primas.
          </div>
        )}
      </div>
    </main>
  );
}
