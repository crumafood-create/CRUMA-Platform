import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function RecipesPage() {
  const supabase = await createClient();

  const { data: recipes } =
    await supabase
      .from('recipes')
      .select(`
        *,
        products (
          name
        )
      `)
      .order('created_at', {
        ascending: false,
      });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Recetas
        </h1>

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
            {recipes.map(recipe => (
              <div
                key={recipe.id}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {recipe.products?.name}
                </div>

                <div className="text-sm text-gray-500">
                  {recipe.notes}
                </div>

                <Link
                  href={`/recipes/${recipe.id}`}
                  className="mt-3 inline-block rounded border px-3 py-1"
                >
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay recetas.</p>
        )}
      </div>
    </main>
  );
}
