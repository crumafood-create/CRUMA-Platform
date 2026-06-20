import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function FamiliesPage() {
  const supabase = await createClient();

  const { data: families, error } = await supabase
    .from('families')
    .select('*')
    .is('deleted_at', null)
    .order('name');

  if (error) {
    return (
      <main className="space-y-6">
        <h1 className="text-4xl font-bold">Familias</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">
            Error al cargar familias: {error.message}
          </p>
        </div>
      </main>
    );
  }

  const familyList = families ?? [];

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Familias</h1>

        <Link
          href="/families/new"
          className="rounded-lg border bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
        >
          Nueva Familia
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {familyList.length > 0 ? (
          <div className="space-y-3">
            {familyList.map((family) => (
              <div
                key={family.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{family.name}</div>

                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        family.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {family.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    <div>Slug: {family.slug}</div>
                    <div>Código: {family.internal_code || '-'}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/families/${family.id}/edit`}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay familias creadas. Crea una nueva para empezar.
          </p>
        )}
      </div>
    </main>
  );
}
