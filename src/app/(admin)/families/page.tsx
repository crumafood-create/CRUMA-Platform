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
            Error loading families: {error.message}
          </p>
        </div>
      </main>
    );
  }

  const familyList = families ?? [];

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Familias
        </h1>

        <Link
          href="/families/new"
          className="rounded border px-4 py-2"
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
  className="rounded border p-4"
>
  <div className="font-semibold">
    {family.name}
  </div>

  <div className="text-sm text-gray-500">
    Slug: {family.slug}
  </div>

  <div className="text-sm text-gray-500">
    Código: {family.internal_code || '-'}
  </div>

  <Link
    href={`/families/${family.id}/edit`}
    className="mt-3 inline-block rounded border px-3 py-1"
  >
    Editar
  </Link>
</div>
            ))}
          </div>
        ) : (
          <p>No hay familias.</p>
        )}
      </div>
    </main>
  );
}
