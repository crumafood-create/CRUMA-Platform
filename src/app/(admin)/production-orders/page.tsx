import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type ProductionOrder = {
  id: string;
  recipe_id: string;
  quantity: number;
  status: string;
  created_at: string;
};

type Recipe = {
  id: string;
  name: string;
};

export default async function ProductionOrdersPage() {
  const supabase = await createClient();

  const [
    { data: orders, error },
    { data: recipes },
  ] = await Promise.all([
    supabase
      .from('production_orders')
      .select(`
        id,
        recipe_id,
        quantity,
        status,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      }),

    supabase
      .from('recipes')
      .select('id, name')
      .order('name'),
  ]);

  if (error) {
    return (
      <main className="space-y-6">
        <h1 className="text-4xl font-bold">
          Producción
        </h1>

        <div className="rounded-2xl border p-6">
          <p className="text-red-600">
            Error al cargar órdenes de producción.
          </p>

          <pre className="mt-4 whitespace-pre-wrap rounded border bg-gray-50 p-4 text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const recipeMap = new Map(
    (recipes ?? []).map(
      (recipe: Recipe) => [
        recipe.id,
        recipe.name,
      ]
    )
  );

  return (
    <main className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Producción
        </h1>

        <Link
          href="/production-orders/new"
          className="rounded border px-4 py-2"
        >
          Nueva Orden
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {orders?.length ? (
          <div className="space-y-3">
            {orders.map(
              (order: ProductionOrder) => (
                <div
                  key={order.id}
                  className="rounded border p-4"
                >
                  <div className="font-semibold">
                    {recipeMap.get(
                      order.recipe_id
                    ) ?? '-'}
                  </div>

                  <div>
                    Cantidad:{' '}
                    {order.quantity}
                  </div>

                  <div>
                    Estado:{' '}
                    {order.status}
                  </div>

                  <Link
                    href={`/production-orders/${order.id}`}
                    className="mt-2 inline-block rounded border px-3 py-1"
                  >
                    Ver Producción
                  </Link>
                </div>
              )
            )}
          </div>
        ) : (
          <p>
            No hay órdenes.
          </p>
        )}
      </div>

    </main>
  );
}
