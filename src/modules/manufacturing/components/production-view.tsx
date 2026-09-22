import Link from 'next/link';
import { getProductionOrders, type ProductionOrderSummary } from '../services/production.service';

function getStatusLabel(status: ProductionOrderSummary['status']): string {
  switch (status) {
    case 'draft': return 'Borrador';
    case 'released': return 'Liberada';
    case 'in_progress': return 'En Producción';
    case 'completed': return 'Completada';
    case 'cancelled': return 'Cancelada';
    default: return status;
  }
}

function getStatusBadge(status: ProductionOrderSummary['status']): string {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-700';
    case 'released': return 'bg-blue-100 text-blue-700';
    case 'in_progress': return 'bg-orange-100 text-orange-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function ProductionCard({ order }: { order: ProductionOrderSummary }) {
  return (
    <Link
      href={`/mobile/production/${order.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500">Orden de Producción</div>
          <div className="mt-1 text-2xl font-bold">{order.order_number}</div>
          <div className="mt-2 text-base font-semibold text-gray-800">{order.product_name}</div>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(order.status)}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm">
        <span className="text-gray-500">Cantidad a Producir:</span>
        <span className="font-bold text-gray-900">{order.quantity} unidades</span>
      </div>

      <div className="mt-4 flex justify-end">
        <span className="font-semibold text-orange-600">Iniciar / Registrar →</span>
      </div>
    </Link>
  );
}

export async function ProductionView() {
  const orders = await getProductionOrders();

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">⚙️ Producción</h1>
          <p className="mt-2 text-sm text-gray-500">Órdenes activas en planta</p>
        </div>
        <div className="rounded-xl bg-orange-100 px-5 py-3 text-center">
          <div className="text-3xl font-bold text-orange-900">{orders.length}</div>
          <div className="text-xs text-orange-700">órdenes</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <div className="text-6xl">⚙️</div>
          <h2 className="mt-4 text-xl font-bold">No hay órdenes en proceso</h2>
          <p className="mt-2 text-gray-600">Todas las órdenes de producción programadas han sido completadas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <ProductionCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}