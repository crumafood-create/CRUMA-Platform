import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function FamiliesPage() {
  const supabase = await createClient();

  const { data: families, error } =
  await supabase
    .from('families')
    .select('*')
    .is('deleted_at', null)
    .order('name');

return (
  <pre>
    {JSON.stringify(
      {
        families,
        error,
      },
      null,
      2
    )}
  </pre>
);

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
        {families?.length ? (
          <div className="space-y-3">
            {families.map(family => (
              <div
                key={family.id}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {family.name}
                </div>

                <div className="text-sm text-gray-500">
                  {family.slug}
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
