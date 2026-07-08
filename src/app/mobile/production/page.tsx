import Link from 'next/link';

import {
  getProductionOrders,
  type ProductionOrderSummary,
} from './actions';

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Borrador';

    case 'released':
      return 'Liberada';

    case 'in_progress':
      return 'En Producción';

    case 'completed':
      return 'Completada';

    case 'cancelled':
      return 'Cancelada';

    default:
      return status;
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700';

    case 'released':
      return 'bg-blue-100 text-blue-700';

    case 'in_progress':
      return 'bg-orange-100 text-orange-700';

    case 'completed':
      return 'bg-green-100 text-green-700';

    case 'cancelled':
      return 'bg-red-100 text-red-700';

    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default async function MobileProductionPage() {
  const orders =
    await getProductionOrders();

  return (
    <main className="space-y-6 p-6 pb-24">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-bold">
            🏭 Producción
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Órdenes de producción
          </p>

        </div>

        <div className="rounded-xl bg-blue-100 px-5 py-3 text-center">

          <div className="text-3xl font-bold text-blue-900">
            {orders.length}
          </div>

          <div className="text-xs text-blue-700">
            órdenes
          </div>

        </div>

      </div>

      {/* LISTADO */}

      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <ProductionCard
              key={order.id}
              order={order}
            />
          ))}
        </div>
      )}

    </main>
  );
}

function ProductionCard({
  order,
}: {
  order: ProductionOrderSummary;
}) {
  const progress =
    order.total_items === 0
      ? 0
      : Math.round(
          (order.completed_items /
            order.total_items) *
            100,
        );

  return (
    <Link
      href={`/mobile/production/${order.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-lg"
    >

      <div className="flex items-start justify-between">

        <div>

          <div className="text-xl font-bold">
            {order.order_number}
          </div>

          <div className="mt-1 text-sm text-gray-500">
            {order.recipe_name}
          </div>

        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
            order.status,
          )}`}
        >
          {getStatusLabel(
            order.status,
          )}
        </span>

      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">

        <div>

          <div className="text-xs text-gray-500">
            Planeado
          </div>

          <div className="text-2xl font-bold">
            {order.planned_quantity}
          </div>

        </div>

        <div>

          <div className="text-xs text-gray-500">
            Producido
          </div>

          <div className="text-2xl font-bold">
            {order.produced_quantity}
          </div>

        </div>

      </div>

      <div className="mt-5">

        <div className="mb-2 flex justify-between text-xs text-gray-500">

          <span>
            Avance
          </span>

          <span>
            {progress}%
          </span>

        </div>

        <div className="h-3 rounded-full bg-gray-200">

          <div
            className="h-3 rounded-full bg-green-600 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      <div className="mt-5 flex items-center justify-between">

        <span className="text-sm font-medium text-blue-700">
          Abrir Producción
        </span>

        <span className="text-xl">
          →
        </span>

      </div>

    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">

      <div className="text-6xl">
        🏭
      </div>

      <h2 className="mt-4 text-xl font-bold">
        No hay órdenes de producción
      </h2>

      <p className="mt-2 text-gray-500">
        Cuando se liberen órdenes aparecerán aquí.
      </p>

    </div>
  );
}
