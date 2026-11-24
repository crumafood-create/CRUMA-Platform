import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

type RawMaterialsSearchParams = {
  created?: string;
};

export default async function RawMaterialsPage({
  searchParams,
}: {
  searchParams?: Promise<RawMaterialsSearchParams>;
}) {
  const [search, supabase] = await Promise.all([
    searchParams ?? Promise.resolve<RawMaterialsSearchParams>({}),
    createTypedClient(),
  ]);
  const { created } = search;

  const [
    { data: materials, error: materialsError },
    { data: units, error: unitsError },
    { data: lots, error: lotsError },
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

    supabase
      .from('raw_material_lots')
      .select('raw_material_id, quantity, inventory_locations(slug)')
      .gt('quantity', 0),
  ]);

  if (materialsError || unitsError || lotsError) {
    return (
      <main className="space-y-6">
        <h1 className="text-4xl font-bold">
          Materias Primas
        </h1>

        <div className="rounded-2xl border p-6">
          <p className="text-red-600">
            Error al cargar materias primas.
          </p>

        </div>
      </main>
    );
  }

  const unitMap = new Map(
    (units ?? []).map((unit) => [
      unit.id,
      `${unit.code} - ${unit.name}`,
    ])
  );
  const locationCodesByMaterial = new Map<string, Set<string>>();
  for (const lot of lots ?? []) {
    const codes = locationCodesByMaterial.get(lot.raw_material_id) ?? new Set<string>();
    codes.add(lot.inventory_locations?.slug ?? 'Sin ubicación');
    locationCodesByMaterial.set(lot.raw_material_id, codes);
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Materias Primas
        </h1>

        <div className="flex gap-2">
          <Link
            href="/purchase-orders/new"
            className="rounded border px-4 py-2"
          >
            Crear orden de compra
          </Link>
          <Link
            href="/raw-materials/new"
            className="rounded border px-4 py-2"
          >
            Nueva Materia Prima
          </Link>
        </div>
      </div>

      {created === '1' ? (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700"
        >
          Materia prima creada correctamente.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border">
        {materials?.length ? (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 text-left">Código</th>
                <th className="p-4 text-left">Nombre</th>
                <th className="p-4 text-left">Unidad</th>
                <th className="p-4 text-left">Stock</th>
                <th className="p-4 text-left">Ubicaciones de lotes</th>
                <th className="p-4 text-left">
                  Costo Promedio
                </th>
                <th className="p-4 text-left">Estado</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>

            <tbody>
              {materials.map((material) => (
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
                    <input
                      type="text"
                      readOnly
                      aria-label={`Ubicaciones de ${material.name}`}
                      value={[...(locationCodesByMaterial.get(material.id) ?? [])]
                        .sort()
                        .join(', ') || '—'}
                      className="w-48 rounded border bg-gray-50 px-2 py-1 text-sm"
                    />
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
