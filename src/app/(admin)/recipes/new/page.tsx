import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { RecipeForm } from '@/app/(admin)/_components/recipe-form';

import { createRecipe } from '../actions';

type Product = {
  id: string;
  name: string;
};

type UnitOfMeasure = {
  id: string;
  name: string;
  code: string;
};

export default async function NewRecipePage() {
  const supabase = await createClient();

  const [
    { data: products, error: productsError },
    { data: unitsOfMeasure, error: unitsError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name')
      .eq('status', 'active')
      .order('name'),

    supabase
      .from('units_of_measure')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name'),
  ]);

  if (productsError || unitsError) {
    return (
      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">
            Nueva Receta
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
            Error al cargar datos para crear la receta.
          </p>

          <pre className="mt-4 whitespace-pre-wrap rounded border bg-gray-50 p-4 text-xs">
            {JSON.stringify(
              {
                productsError,
                unitsError,
              },
              null,
              2
            )}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Nueva Receta
        </h1>

        <Link
          href="/recipes"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <RecipeForm
        action={createRecipe}
        products={(products ?? []) as Product[]}
        unitsOfMeasure={(unitsOfMeasure ?? []) as UnitOfMeasure[]}
      />
    </main>
  );
}
