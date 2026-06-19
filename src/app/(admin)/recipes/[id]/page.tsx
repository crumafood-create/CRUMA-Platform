import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { RecipeItemsForm } from '@/app/(admin)/_components/recipe-item-form';

import { createRecipeItem } from './actions';

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: recipe } =
    await supabase
      .from('recipes')
      .select(`
        *,
        products (
          name
        )
      `)
      .eq('id', id)
      .single();

  if (!recipe) {
    notFound();
  }

  const { data: items } =
    await supabase
      .from('recipe_items')
      .select(`
        *,
        products!recipe_items_ingredient_id_fkey (
          name
        )
      `)
      .eq('recipe_id', id);

  const { data: rawMaterials } =
  await supabase
    .from('raw_materials')
    .select('id, name')
    .is('deleted_at', null)
    .order('name');

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        {recipe.products?.name}
      </h1>

      <RecipeItemsForm
  materials={rawMaterials ?? []}
/>

      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Ingredientes
        </h2>

        {items?.length ? (
          <div className="space-y-3">
            {items.map(item => (
              <div
                key={item.id}
                className="rounded border p-3"
              >
                <div>
                  {
                    item.products?.name
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
