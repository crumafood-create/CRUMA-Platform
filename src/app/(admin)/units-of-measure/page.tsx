import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function UnitsOfMeasurePage() {
  const supabase = await createClient();

  const { data: units } =
    await supabase
      .from('units_of_measure')
      .select('*')
      .order('name');

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
        {units?.map((unit) => (
          <div
            key={unit.id}
            className="mb-3 rounded border p-4"
          >
            <div className="font-semibold">
              {unit.name}
            </div>

            <div className="text-sm text-gray-500">
              {unit.code}
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
    </main>
  );
}
