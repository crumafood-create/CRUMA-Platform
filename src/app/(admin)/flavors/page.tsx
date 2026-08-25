import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function FlavorsPage() {
  const supabase = await createTypedClient();

  const { data: flavors, error } = await supabase
    .from('flavors')
    .select('id, name, slug')
    .is('deleted_at', null)
    .order('name');

  if (error) {
    return (
      <main className="space-y-6">
        <h1 className="text-4xl font-bold">
          Sabores
        </h1>

        <div className="rounded-2xl border p-6">
          <p className="text-red-600">
            Error al cargar sabores.
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
          Sabores
        </h1>

        <Link
          href="/flavors/new"
          className="rounded border px-4 py-2"
        >
          Nuevo Sabor
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {flavors?.length ? (
          <div className="space-y-3">
            {flavors.map((flavor) => (
              <div
                key={flavor.id}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {flavor.name}
                </div>

                <div className="text-sm text-gray-500">
                  {flavor.slug}
                </div>

                <Link
                  href={`/flavors/${flavor.id}/edit`}
                  className="mt-3 inline-block rounded border px-3 py-1"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay sabores.</p>
        )}
      </div>
    </main>
  );
}
