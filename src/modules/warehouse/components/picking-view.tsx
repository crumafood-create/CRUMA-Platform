import Link from 'next/link';
import { getActivePickingOrders, type PickingOrder } from '../services/picking.service';

function getStatusLabel(status: PickingOrder['status']): string {
  switch (status) {
    case 'pending': return 'Pendiente';
    case 'in_progress': return 'En progreso';
    case 'completed': return 'Completado';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
}

function getStatusBadgeClass(status: PickingOrder['status']): string {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export async function PickingView() {
  const pickingList = await getActivePickingOrders();

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">📦 Picking</h1>
          <p className="mt-1 text-sm text-gray-500">Órdenes pendientes de preparación</p>
        </div>
        <div className="rounded-xl bg-blue-100 px-4 py-3 text-center">
          <div className="text-3xl font-bold text-blue-900">{pickingList.length}</div>
          <div className="text-xs text-blue-700">
            {pickingList.length === 1 ? 'orden' : 'órdenes'}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {pickingList.length > 0 ? (
          pickingList.map((picking) => (
            <Link
              key={picking.id}
              href={`/mobile/picking/${picking.id}`}
              className="block min-h-44 rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-lg sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Pedido</div>
                  <div className="mt-1 text-xl font-bold text-gray-900">
                    {picking.sales_order_id}
                  </div>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(picking.status)}`}
                >
                  {getStatusLabel(picking.status)}
                </span>
              </div>

              <div className="mt-5 border-t pt-4 text-xs text-gray-500">
                <div>ID: {picking.id.slice(0, 8)}...</div>
                <div className="mt-1">
                  {new Date(picking.created_at).toLocaleString('es-MX')}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">Iniciar picking</span>
                <span className="text-xl text-blue-600">→</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <div className="text-6xl">📦</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No hay pickings pendientes
            </h3>
            <p className="mt-2 text-gray-600">
              Las nuevas órdenes aparecerán aquí automáticamente.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}