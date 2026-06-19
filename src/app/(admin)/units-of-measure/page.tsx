import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

// ─── Types ────────────────────────────────────────────────────────────────────

type UnitOfMeasure = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UnitsOfMeasurePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: units, error } = await supabase
    .from('units_of_measure')
    .select('id, name, code, is_active')
    .order('name');

  if (error) {
    return (
      <main className="space-y-6">
        <Header />

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

  const filtered = q
    ? units?.filter(
        (unit) =>
          unit.name.toLowerCase().includes(q.toLowerCase()) ||
          unit.code.toLowerCase().includes(q.toLowerCase())
      )
    : units;

  return (
    <main className="space-y-6">
      <Header />

      <div className="rounded-2xl border p-6 space-y-4">

        {/* BÚSQUEDA */}
        <form method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar unidad..."
            className="w-full rounded-lg border p-3"
            autoComplete="off"
          />
        </form>

        {/* LISTADO */}
        {filtered?.length ? (
          <div className="space-y-3">
            {filtered.map((unit: UnitOfMeasure) => (
              <div key={unit.id} className="rounded border p-4">
                <div className="font-semibold">
                  {unit.code} — {unit.name}
                </div>
                <div className="text-sm text-gray-500">
                  {unit.is_active ? 'Activo' : 'Inactivo'}
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
          <p className="text-sm text-gray-500">
            {q ? `Sin resultados para "${q}".` : 'No hay unidades de medida.'}
          </p>
        )}
      </div>
    </main>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-4xl font-bold">Unidades de Medida</h1>
      <Link href="/units-of-measure/new" className="rounded border px-4 py-2">
        Nueva Unidad
      </Link>
    </div>
  );
}
