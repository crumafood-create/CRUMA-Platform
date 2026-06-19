import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { ProductionOrderForm } from '@/app/(admin)/_components/production-order-form';

import { createProductionOrder } from '../actions';

type Recipe = {
  id: string;
  name: string;
};

export default async function NewProductionOrderPage() {
  const supabase = await createClient();

  const { data: recipes, error } =
    await supabase
      .from('recipes')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

  if (error) {
    return (
      <main className="space-y-6">
        <h1 className="text-4xl font-bold">
          Nueva Orden
        </h1>

        <div className="rounded-2xl border p-6">
          <p className="text-red-600">
            Error al cargar recetas.
          </p>

          <pre className="mt-4 whitespace-pre-wrap rounded border bg-gray-50 p-4 text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

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
        recipes={(recipes ?? []) as Recipe[]}
      />
    </main>
  );
}
