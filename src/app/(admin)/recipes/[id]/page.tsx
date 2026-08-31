import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function RecipePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase = await createTypedClient();

  const { data: recipe } = await supabase
    .from('recipes')
    .select(`
      id,
      name,
      description,
      yield_quantity,
      is_active,
      products (
        name
      )
    `)
    .eq('id', id)
    .single();

  if (!recipe) {
    notFound();
  }

  const product =
    Array.isArray(recipe.products)
      ? recipe.products[0]
      : recipe.products;

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Receta
        </h1>

        <Link
          href="/recipes"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">
              Nombre
            </div>

            <div className="font-semibold">
              {recipe.name}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Producto
            </div>

            <div className="font-semibold">
              {product?.name ?? '-'}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Rendimiento
            </div>

            <div className="font-semibold">
              {recipe.yield_quantity ?? '-'}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Estado
            </div>

            <div className="font-semibold">
              {recipe.is_active
                ? 'Activa'
                : 'Inactiva'}
            </div>
          </div>

          {recipe.description && (
            <div>
              <div className="text-sm text-gray-500">
                Descripción
              </div>

              <div>
                {recipe.description}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/recipes/${recipe.id}/ingredients`}
          className="rounded-lg border bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
        >
          Ingredientes
        </Link>

      </div>
    </main>
  );
}
