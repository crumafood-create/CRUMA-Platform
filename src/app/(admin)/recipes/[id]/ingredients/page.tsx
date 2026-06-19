import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { createRecipeItem } from './actions';

type RecipeRow = {
  id: string;
  name: string;
  product_id: string | null;
};

type RawMaterialRow = {
  id: string;
  name: string;
};

type RecipeItemRow = {
  id: string;
  ingredient_id: string;
  quantity: number;
};

export default async function RecipeIngredientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const [
    { data: recipe, error: recipeError },
    { data: materials, error: materialsError },
    { data: items, error: itemsError },
  ] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, name, product_id')
      .eq('id', id)
      .single(),

    supabase
      .from('raw_materials')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),

    supabase
      .from('recipe_items')
      .select('id, ingredient_id, quantity')
      .eq('recipe_id', id)
      .order('created_at', { ascending: true }),
  ]);

  const error = recipeError ?? materialsError ?? itemsError;

  if (error || !recipe) {
    return (
      <main className="space-y-6">
        <div className="flex justify-between">
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
          <p className="text-red-600">
            Error al cargar la receta o sus ingredientes.
          </p>

          <pre className="mt-4 whitespace-pre-wrap rounded border bg-gray-50 p-4 text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const materialMap = new Map(
    (materials ?? []).map((material: RawMaterialRow) => [
      material.id,
      material.name,
    ])
  );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Ingredientes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {recipe.name}
          </p>
        </div>

        <Link
          href="/recipes"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        <form action={createRecipeItem} className="space-y-4">
          <input type="hidden" name="recipe_id" value={recipe.id} />

          <div>
            <label className="mb-2 block font-medium">
              Materia prima *
            </label>

            <select
              name="ingredient_id"
              required
              className="w-full rounded border p-3"
              defaultValue=""
            >
              <option value="">
                Seleccionar materia prima
              </option>

              {materials?.map((material: RawMaterialRow) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Cantidad *
            </label>

            <input
              type="number"
              step="0.0001"
              min="0.0001"
              name="quantity"
              required
              className="w-full rounded border p-3"
              placeholder="1.0000"
            />
          </div>

          <button
            type="submit"
            className="rounded border px-6 py-2"
          >
            Agregar ingrediente
          </button>
        </form>
      </div>

      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Ingredientes actuales
        </h2>

        {items?.length ? (
          <div className="space-y-3">
            {items.map((item: RecipeItemRow) => (
              <div key={item.id} className="rounded border p-3">
                <div className="font-medium">
                  {materialMap.get(item.ingredient_id) ?? '-'}
                </div>

                <div className="text-sm text-gray-500">
                  Cantidad: {item.quantity}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No hay ingredientes.
          </p>
        )}
      </div>
    </main>
  );
}
