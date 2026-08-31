import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { RecipeForm } from '@/app/(admin)/_components/recipe-form';

import { createRecipe } from '../actions';

export default async function NewRecipePage() {
  const supabase = await createTypedClient();

  const [
    { data: products, error: productsError },
    { data: unitsOfMeasure, error: unitsError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name')
      .is('deleted_at', null)
      .eq('status', 'active')
      .order('name'),

    supabase
      .from('units_of_measure')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name'),
  ]);

  if (productsError || unitsError) {
    throw new Error('No se pudieron cargar los datos para crear la receta.');
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
        products={products ?? []}
        unitsOfMeasure={unitsOfMeasure ?? []}
      />
    </main>
  );
}
