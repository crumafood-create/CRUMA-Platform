import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function FlavorsPage() {
  const supabase = await createClient();

  const { data: flavors } =
    await supabase
      .from('flavors')
      .select(`
        *,
        families (
          name
        )
      `)
      .is('deleted_at', null)
      .order('name');

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
            {flavors.map(flavor => (
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

                <div className="text-sm text-gray-500">
                  Familia:
                  {' '}
                  {flavor.families?.name}
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
