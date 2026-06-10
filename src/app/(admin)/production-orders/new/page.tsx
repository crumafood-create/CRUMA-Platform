import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { ProductionOrderForm } from '@/app/(admin)/_components/production-order-form';

import { createProductionOrder } from '../actions';

export default async function NewProductionOrderPage() {
  const supabase = await createClient();

  const { data: recipes } =
    await supabase
      .from('recipes')
      .select(`
        id,
        product_id,
        products:products!recipes_product_id_fkey (
          name
        )
      `);

  const recipesData =
    (recipes ?? []).map(recipe => ({
      id: recipe.id,
      products: Array.isArray(recipe.products)
        ? recipe.products[0] ?? null
        : recipe.products,
    }));

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Nueva Orden
        </h1>

        <Link
          href="/production-orders"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <ProductionOrderForm
        action={createProductionOrder}
        recipes={recipesData}
      />
    </main>
  );
}
