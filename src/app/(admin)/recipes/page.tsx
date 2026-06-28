import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type RecipeRow = {
  id: string;
  name: string;
  description: string | null;
  yield_quantity: number | null;
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
      .select(
        'id, name, description, yield_quantity, is_active, product_id'
      )
      .order('name'),

    supabase
      .from('products')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
  ]);

  if (error) {
    return (
      <pre>{JSON.stringify(error, null, 2)}</pre>
    );
  }

  const productMap = new Map(
    (products ?? []).map(
      (product: ProductRow) => [
        product.id,
        product.name,
      ]
    )
  );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Recetas
        </h1>

        <Link
          href="/recipes/new"
          className="rounded-lg border bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
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
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div>
                  <div className="font-semibold">
                    {recipe.name}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <div>
                      Producto:{' '}
                      {recipe.product_id
                        ? productMap.get(
                            recipe.product_id
                          ) ?? '-'
                        : '-'}
                    </div>

                    <div>
                      Rendimiento:{' '}
                      {recipe.yield_quantity ?? '-'}
                    </div>

                    <div>
                      Estado:{' '}
                      {recipe.is_active
                        ? 'Activa'
                        : 'Inactiva'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="rounded border px-3 py-2"
                  >
                    Ver
                  </Link>

                  <Link
                    href={`/recipes/${recipe.id}/edit`}
                    className="rounded border px-3 py-2"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay recetas creadas.
          </p>
        )}
      </div>
    </main>
  );
}
