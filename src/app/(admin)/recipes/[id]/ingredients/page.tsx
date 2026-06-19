import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { addRecipeItem } from './actions';

export default async function RecipeIngredientsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  const { data: materials } = await supabase
    .from('raw_materials')
    .select('id,name')
    .order('name');

  const { data: items } = await supabase
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
        <h2 className="mb-4 text-xl font-semibold">
          {recipe?.name}
        </h2>

        <form
          action={addRecipeItem}
          className="space-y-4"
        >
          <input
            type="hidden"
            name="recipe_id"
            value={id}
          />

          <select
            name="raw_material_id"
            required
            className="w-full rounded border p-3"
          >
            <option value="">
              Materia prima
            </option>

            {materials?.map(material => (
              <option
                key={material.id}
                value={material.id}
              >
                {material.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.001"
            name="quantity"
            required
            placeholder="Cantidad"
            className="w-full rounded border p-3"
          />

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
            {items.map(item => (
              <div
                key={item.id}
                className="rounded border p-3"
              >
                <div>
                  {item.raw_materials?.name}
                </div>

                <div className="text-sm text-gray-500">
                  Cantidad: {item.quantity}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay ingredientes.</p>
        )}
      </div>
    </main>
  );
}
