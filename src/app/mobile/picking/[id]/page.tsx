import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

// ============================================================================
// TIPOS
// ============================================================================

type PickingOrder = {
  id: string;
  status: string;
  sales_order_id: string;
  created_at: string;
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene el label de estado en español
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'in_progress':
      return 'En progreso';
    case 'completed':
      return 'Completado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
}

/**
 * Obtiene la clase CSS para el badge de estado
 */
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de listado de órdenes de picking
 * Server Component que obtiene datos de Supabase
 */
export default async function MobilePickingListPage() {
  const supabase = await createClient();

  // Obtener órdenes de picking pendientes/en progreso
  const { data: pickings, error } = await supabase
    .from('picking_orders')
    .select('id, status, sales_order_id, created_at')
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false });

  // Manejo de errores
  if (error) {
    return (
      <main className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Picking</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">
            Error al cargar pickings: {error.message}
          </p>
        </div>
      </main>
    );
  }

  const pickingList: PickingOrder[] = pickings ?? [];

  return (
    <main className="space-y-6 p-6">
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Picking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Órdenes pendientes de procesar
          </p>
        </div>

        <div className="rounded-lg bg-blue-100 px-4 py-2">
          <p className="text-2xl font-bold text-blue-900">
            {pickingList.length}
          </p>
          <p className="text-xs text-blue-600">
            {pickingList.length === 1 ? 'orden' : 'órdenes'}
          </p>
        </div>
      </div>

      {/* LISTADO DE PICKINGS */}
      <div className="space-y-4">
        {pickingList.length > 0 ? (
          pickingList.map((picking) => (
            <PickingOrderCard
              key={picking.id}
              picking={picking}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}

// ============================================================================
// COMPONENTES REUTILIZABLES
// ============================================================================

/**
 * Tarjeta de orden de picking
 */
function PickingOrderCard({ picking }: { picking: PickingOrder }) {
  const formattedDate = new Date(picking.created_at).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      href={`/mobile/picking/${picking.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg"
    >
      {/* Encabezado: Número de Pedido y Estado */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600">
            Número de Pedido
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {picking.sales_order_id}
          </div>
        </div>

        <div className="shrink-0">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
              picking.status
            )}`}
          >
            {getStatusLabel(picking.status)}
          </span>
        </div>
      </div>

      {/* Detalles adicionales */}
      <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-gray-500">
        <div>
          <span>ID: {picking.id.slice(0, 8)}...</span>
          <span className="ml-3">•</span>
          <span className="ml-3">{formattedDate}</span>
        </div>

        <div className="flex items-center text-blue-600 font-medium">
          Procesar →
        </div>
      </div>
    </Link>
  );
}

/**
 * Estado vacío - Sin órdenes pendientes
 */
function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      <div className="text-5xl mb-4">📦</div>
      <h3 className="text-lg font-semibold text-gray-900">
        No hay pickings pendientes
      </h3>
      <p className="mt-2 text-gray-600">
        Las nuevas órdenes de picking aparecerán aquí cuando estén disponibles
      </p>

      <Link
        href="/mobile/picking"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
      >
        Recargar
      </Link>
    </div>
  );
}
