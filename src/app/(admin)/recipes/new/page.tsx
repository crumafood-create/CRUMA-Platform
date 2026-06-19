import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { RecipeForm } from '@/app/(admin)/_components/recipe-form';

import { createRecipe } from '../actions';

export default async function NewRecipePage() {
  const supabase = await createClient();

  const { data: unitsOfMeasure } = await supabase
    .from('units_of_measure')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name');

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
        unitsOfMeasure={unitsOfMeasure ?? []}
      />
    </main>
  );
}
