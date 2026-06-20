import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { RecipeItemForm } from '@/app/(admin)/_components/recipe-item-form';

import { createRecipeItem } from './actions';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipeIngredientsPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase =
    await createClient();

  const { data: recipe } =
    await supabase
      .from('recipes')
      .select('id,name')
      .eq('id', id)
      .single();

  const {
    data: materials,
  } = await supabase
    .from('raw_materials')
    .select('id,name')
    .eq('is_active', true)
    .order('name');

  const {
    data: items,
  } = await supabase
    .from('recipe_items')
    .select(`
      *,
      raw_materials (
        name
      )
    `)
    .eq('recipe_id', id);

  return (
    <main className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Ingredientes
        </h1>

        <Link
          href="/recipes"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        <div className="mb-6 text-xl font-semibold">
          {recipe?.name}
        </div>

        <RecipeItemForm
  recipeId={id}
  materials={materials ?? []}
  action={createRecipeItem}
/>
      </div>

      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Ingredientes
        </h2>

        {items?.length ? (
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="rounded border p-3"
              >
                <div>
                  {
                    item.raw_materials?.name
                  }
                </div>

                <div className="text-sm text-gray-500">
                  Cantidad:
                  {' '}
                  {item.quantity}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>
            No hay ingredientes.
          </p>
        )}
      </div>

    </main>
  );
}
