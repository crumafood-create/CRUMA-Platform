import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'released':
      return 'Liberada';
    case 'in_progress':
      return 'En producción';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

export default async function ProductionOrdersPage() {
  const supabase = await createTypedClient();

  const [
    { data: orders, error },
    { data: recipes },
  ] = await Promise.all([
    supabase
      .from('production_orders')
      .select('id, production_number, recipe_id, planned_quantity, produced_quantity, production_status, created_at')
      .order('created_at', { ascending: false }),

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
    (recipes ?? []).map((recipe) => [
      recipe.id,
      recipe.name,
    ])
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
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {order.production_number}
                </div>

                <div className="text-sm text-gray-500">
                  Receta:{' '}
                  {recipeMap.get(order.recipe_id) ?? '-'}
                </div>

                <div className="text-sm text-gray-500">
                  Planeado: {order.planned_quantity}
                </div>

                <div className="text-sm text-gray-500">
                  Producido:{' '}
                  {order.produced_quantity ?? 0}
                </div>

                <div className="text-sm text-gray-500">
                  Estado: {getStatusLabel(order.production_status)}
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/production-orders/${order.id}`}
                    className="rounded border px-3 py-1"
                  >
                    Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay órdenes de producción.
          </p>
        )}
      </div>
    </main>
  );
}
