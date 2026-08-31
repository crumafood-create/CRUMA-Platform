import Link from 'next/link';

import { RecipeItemForm } from '@/app/(admin)/_components/recipe-item-form';

import { createRecipeItem } from './actions';

type Recipe = { id: string; name: string };
type Material = { id: string; name: string };
type RecipeItem = { id: string; raw_material_id: string; quantity: number };

interface Props {
  recipe: Recipe;
  materials: Material[];
  items: RecipeItem[];
}

export function RecipeIngredientsView({ recipe, materials, items }: Props) {
  const materialNames = new Map(materials.map(({ id, name }) => [id, name]));

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Ingredientes</h1>
          <p className="mt-1 text-sm text-gray-500">{recipe.name}</p>
        </div>
        <Link href="/recipes" className="rounded border px-4 py-2">
          Volver
        </Link>
      </header>

      <RecipeItemForm
        recipeId={recipe.id}
        materials={materials}
        action={createRecipeItem}
      />

      <section className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Ingredientes actuales</h2>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <div className="font-medium">
                  {materialNames.get(item.raw_material_id) ?? '-'}
                </div>
                <div className="text-sm text-gray-500">
                  Cantidad: {item.quantity}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay ingredientes.</p>
        )}
      </section>
    </main>
  );
}
