import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { RecipeForm } from '@/app/(admin)/_components/recipe-form';

import { createRecipe } from '../actions';

export default async function NewRecipePage() {
  const supabase = await createClient();

  const { data: products } =
    await supabase
      .from('products')
      .select('id, name')
      .is('deleted_at', null)
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
        products={products ?? []}
      />
    </main>
  );
}
