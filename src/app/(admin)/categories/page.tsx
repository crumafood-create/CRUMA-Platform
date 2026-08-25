import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function CategoriesPage() {
  const supabase = await createTypedClient();

  const {
    data: categories,
    error,
  } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('name');

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Error al cargar categorías
        </h1>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Categorías
        </h1>

        <Link
          href="/categories/new"
          className="rounded border px-4 py-2"
        >
          Nueva Categoría
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {categories?.length ? (
          <div className="space-y-3">
            {categories.map(category => (
              <div
                key={category.id}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {category.name}
                </div>

                <div className="text-sm text-gray-500">
                  {category.slug}
                </div>

                {category.description && (
                  <div className="text-sm text-gray-500 mt-1">
                    {category.description}
                  </div>
                )}

                <div className="text-sm text-gray-500 mt-1">
                  Estado:{' '}
                  {category.is_active
                    ? 'Activo'
                    : 'Inactivo'}
                </div>

                <Link
                  href={`/categories/${category.id}/edit`}
                  className="mt-3 inline-block rounded border px-3 py-1"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay categorías.</p>
        )}
      </div>
    </main>
  );
}
