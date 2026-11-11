import Link from 'next/link';

import { RecipeItemForm } from '@/modules/manufacturing/components/forms/recipe-item-form';

import { createRecipeItem, deleteRecipeItem, updateRecipeItem } from './actions';

type IngredientOption = { id: string; name: string; unitLabel: string };
type RecipeItem = {
  id: string;
  raw_material_id: string | null;
  product_id: string | null;
  quantity: number;
};

interface Props {
  recipe: { id: string; name: string; product_id: string };
  materials: IngredientOption[];
  intermediateProducts: IngredientOption[];
  items: RecipeItem[];
}

export function RecipeIngredientsView({
  recipe,
  materials,
  intermediateProducts,
  items,
}: Props) {
  const ingredientNames = new Map(
    [...materials, ...intermediateProducts].map(({ id, name, unitLabel }) => [
      id,
      `${name} · ${unitLabel}`,
    ]),
  );

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
        intermediateProducts={intermediateProducts}
        action={createRecipeItem}
      />

      <section className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Ingredientes actuales</h2>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => {
              const ingredientId = item.raw_material_id ?? item.product_id;

              return (
                <div key={item.id} className="rounded border p-3">
                  <div className="font-medium">
                    {ingredientId ? ingredientNames.get(ingredientId) ?? '-' : '-'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Cantidad en unidad base: {item.quantity}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                    <RecipeItemForm
                      recipeId={recipe.id}
                      materials={materials}
                      intermediateProducts={intermediateProducts}
                      action={updateRecipeItem}
                      initialValues={item}
                    />
                    <form action={deleteRecipeItem}>
                      <input type="hidden" name="recipe_id" value={recipe.id} />
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="rounded border border-red-300 px-4 py-2 text-red-700">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay ingredientes.</p>
        )}
      </section>
    </main>
  );
}
