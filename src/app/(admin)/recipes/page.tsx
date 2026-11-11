import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export default async function RecipesPage() {
  const supabase = await createTypedClient();

  const [
    { data: recipes, error },
    { data: products },
    { data: units, error: unitsError },
  ] = await Promise.all([
    supabase
      .from('recipes')
      .select(
        'id, name, description, yield_quantity, unit_of_measure_id, is_active, product_id'
      )
      .order('name'),

    supabase
      .from('products')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),

    supabase
      .from('units_of_measure')
      .select('id, name, code'),
  ]);

  if (error || unitsError) throw new Error('No se pudieron cargar las recetas.');

  const productMap = new Map(
    (products ?? []).map(
      (product) => [
        product.id,
        product.name,
      ]
    )
  );
  const unitMap = new Map(
    (units ?? []).map((unit) => [unit.id, unit.code]),
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
            {recipes.map((recipe) => (
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
                      {recipe.yield_quantity ?? '-'}{' '}
                      {recipe.unit_of_measure_id
                        ? unitMap.get(recipe.unit_of_measure_id) ?? ''
                        : ''}
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
