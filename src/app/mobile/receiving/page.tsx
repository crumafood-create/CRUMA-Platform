import Link from 'next/link';

import {
  getReceivingOrders,
  type ReceivingOrder,
} from './actions';

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Borrador';

    case 'pending':
      return 'Pendiente';

    case 'partial':
      return 'Parcial';

    case 'received':
      return 'Recibida';

    case 'cancelled':
      return 'Cancelada';

    default:
      return status;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';

    case 'pending':
      return 'bg-yellow-100 text-yellow-800';

    case 'partial':
      return 'bg-blue-100 text-blue-800';

    case 'received':
      return 'bg-green-100 text-green-800';

    case 'cancelled':
      return 'bg-red-100 text-red-800';

    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// ============================================================================
// PAGE
// ============================================================================

export default async function MobileReceivingPage() {
  const orders = await getReceivingOrders();

  return (
    <main className="space-y-6 p-6 pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            📦 Recepción
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Órdenes de compra pendientes
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

      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <ReceivingCard
              key={order.id}
              order={order}
            />
          ))}
        </div>
      )}
    </main>
  );
}

// ============================================================================
// CARD
// ============================================================================

function ReceivingCard({
  order,
}: {
  order: ReceivingOrder;
}) {
  return (
    <Link
      href={`/mobile/receiving/${order.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500">
            Orden de Compra
          </div>

          <div className="mt-1 text-2xl font-bold">
            {order.order_number}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {order.supplier_name}
          </div>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
            order.status,
          )}`}
        >
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            Partidas
          </span>

          <span className="font-semibold">
            {order.received_items} / {order.total_items}
          </span>
        </div>

        <div className="mt-3 h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-green-600"
            style={{
              width: `${
                order.total_items === 0
                  ? 0
                  : (order.received_items /
                      order.total_items) *
                    100
              }%`,
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <span className="font-semibold text-blue-600">
          Recibir →
        </span>
      </div>
    </Link>
  );
}

// ============================================================================
// EMPTY
// ============================================================================

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
      <div className="text-6xl">
        📦
      </div>

      <h2 className="mt-4 text-xl font-bold">
        No hay órdenes pendientes
      </h2>

      <p className="mt-2 text-gray-600">
        Todas las órdenes de compra
        fueron recibidas.
      </p>
    </div>
  );
}
