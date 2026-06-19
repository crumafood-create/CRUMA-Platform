import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type RecipeRow = {
  id: string;
  name: string;
  is_active: boolean;
  product_id: string | null;
};

type ProductRow = {
  id: string;
  name: string;
};

export default async function RecipesPage() {
  const supabase = await createClient();

  const [
    { data: recipes, error },
    { data: products },
  ] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, name, is_active, product_id')
      .order('name'),

    supabase
      .from('products')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
  ]);

  if (error) {
    return (
      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Recetas</h1>

          <Link
            href="/recipes/new"
            className="rounded border px-4 py-2"
          >
            Nueva Receta
          </Link>
        </div>

        <div className="rounded-2xl border p-6">
          <p className="text-sm text-red-600">
            Error al cargar recetas.
          </p>

          <pre className="mt-4 whitespace-pre-wrap rounded border bg-gray-50 p-4 text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const productMap = new Map(
    (products ?? []).map((product: ProductRow) => [
      product.id,
      product.name,
    ])
  );

  return (
    <main className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-4xl font-bold">Recetas</h1>

        <Link
          href="/recipes/new"
          className="rounded border px-4 py-2"
        >
          Nueva Receta
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {recipes?.length ? (
          <div className="space-y-3">
            {recipes.map((recipe: RecipeRow) => (
              <div
                key={recipe.id}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {recipe.name}
                </div>

                <div className="text-sm text-gray-500">
                  Producto:{' '}
                  {recipe.product_id
                    ? productMap.get(recipe.product_id) ?? '-'
                    : '-'}
                </div>

                <div className="text-sm text-gray-500">
                  {recipe.is_active ? 'Activa' : 'Inactiva'}
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/recipes/${recipe.id}/edit`}
                    className="rounded border px-3 py-1"
                  >
                    Editar
                  </Link>

                  <Link
                    href={`/recipes/${recipe.id}/ingredients`}
                    className="rounded border px-3 py-1"
                  >
                    Ingredientes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No hay recetas.
          </p>
        )}
      </div>
    </main>
  );
}
