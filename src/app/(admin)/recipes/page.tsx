import Link from 'next/link';

import { createClient }
from '@/infrastructure/integrations/supabase/server';

export default async function RecipesPage() {
  const supabase = await createClient();

  const { data } =
    await supabase
      .from('recipes')
      .select('*')
      .is('deleted_at', null)
      .order('name');

  return (
    <main className="space-y-6">
      <div className="flex justify-between">
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

      <div className="rounded-2xl border">
        {data?.map((recipe) => (
          <div
            key={recipe.id}
            className="border-b p-4"
          >
            <div className="font-semibold">
              {recipe.name}
            </div>

            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="text-sm"
            >
              Editar
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
