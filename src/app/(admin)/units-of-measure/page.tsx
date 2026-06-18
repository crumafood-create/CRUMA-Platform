import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type UnitOfMeasure = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
};

export default async function UnitsOfMeasurePage() {
  const supabase = await createClient();

  const { data: units, error } = await supabase
    .from('units_of_measure')
    .select('id, name, code, is_active')
    .order('name');

  if (error) {
    console.error('Error loading units_of_measure:', error);

    return (
      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">
            Unidades de Medida
          </h1>

          <Link
            href="/units-of-measure/new"
            className="rounded border px-4 py-2"
          >
            Nueva Unidad
          </Link>
        </div>

        <div className="rounded-2xl border p-6">
          <p className="text-sm text-red-600">
            Error al cargar las unidades de medida.
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded border bg-gray-50 p-4 text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Unidades de Medida
        </h1>

        <Link
          href="/units-of-measure/new"
          className="rounded border px-4 py-2"
        >
          Nueva Unidad
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {units?.length ? (
          <div className="space-y-3">
            {units.map((unit: UnitOfMeasure) => (
              <div
                key={unit.id}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {unit.code} - {unit.name}
                </div>

                <div className="text-sm text-gray-500">
                  Estado: {unit.is_active ? 'Activo' : 'Inactivo'}
                </div>

                <Link
                  href={`/units-of-measure/${unit.id}/edit`}
                  className="mt-3 inline-block rounded border px-3 py-1"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay unidades de medida.</p>
        )}
      </div>
    </main>
  );
}
