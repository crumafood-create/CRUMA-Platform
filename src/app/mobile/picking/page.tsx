import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

// ============================================================================
// TIPOS
// ============================================================================

type PickingOrder = {
  id: string;
  status: string;
  sales_order_id: string;
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

export default async function MobilePickingListPage() {
  const supabase = await createClient();

  const { data: pickings, error } = await supabase
    .from('picking_orders')
    .select('id, status, sales_order_id')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <main className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Picking</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">Error al cargar pickings: {error.message}</p>
        </div>
      </main>
    );
  }

  const pickingList: PickingOrder[] = pickings ?? [];

  return (
    <main className="space-y-6 p-6">
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Picking</h1>
        <p className="text-sm text-gray-500">
          {pickingList.length} {pickingList.length === 1 ? 'orden' : 'órdenes'}
        </p>
      </div>

      {/* LISTADO DE PICKINGS */}
      <div className="space-y-4">
        {pickingList.length > 0 ? (
          pickingList.map((picking) => (
            <Link
              key={picking.id}
              href={`/mobile/picking/${picking.id}`}
              className="block rounded-2xl border bg-white p-6 hover:shadow-lg transition-shadow"
            >
              {/* Número de Pedido */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    Pedido
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {picking.sales_order_id}
                  </div>
                </div>

                {/* Estado */}
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                    picking.status
                  )}`}
                >
                  {getStatusLabel(picking.status)}
                </span>
              </div>

              {/* ID de Picking */}
              <div className="mt-4 text-xs text-gray-500">
                ID: {picking.id}
              </div>

              {/* Call to Action */}
              <div className="mt-4 flex items-center text-blue-600 font-medium">
                Iniciar picking →
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border bg-gray-50 p-6 text-center text-gray-500">
            <p className="text-lg">No hay pickings pendientes</p>
            <p className="mt-2 text-sm">
              Los nuevos pickings aparecerán aquí
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
