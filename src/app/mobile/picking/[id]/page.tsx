import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';
import MobileScanner from '@/app/mobile/components/mobile-scanner';
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

function getStatusLabel(
  status: string,
): string {
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

function getStatusBadgeClass(
  status: string,
): string {
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
// PAGE
// ============================================================================

export default async function MobilePickingListPage() {
  const supabase =
    await createClient();

  const {
    data: pickings,
    error,
  } = await supabase
    .from('picking_orders')
    .select(`
      id,
      status,
      sales_order_id,
      created_at
    `)
    .in('status', [
      'pending',
      'in_progress',
    ])
    .order(
      'created_at',
      {
        ascending: false,
      },
    );

  if (error) {
    return (
      <main className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">
          Picking
        </h1>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">
            Error al cargar
            pickings:
            {' '}
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  const pickingList:
    PickingOrder[] =
    pickings ?? [];

  return (
    <main className="space-y-6 p-6 pb-24">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">
            📦 Picking
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Órdenes pendientes
            de preparación
          </p>
        </div>

        <div className="rounded-xl bg-blue-100 px-4 py-3 text-center">
          <div className="text-3xl font-bold text-blue-900">
            {
              pickingList.length
            }
          </div>

          <div className="text-xs text-blue-700">
            {pickingList.length ===
            1
              ? 'orden'
              : 'órdenes'}
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div className="space-y-4">
        {pickingList.length >
        0 ? (
          pickingList.map(
            (
              picking,
            ) => (
              <PickingOrderCard
                key={
                  picking.id
                }
                picking={
                  picking
                }
              />
            ),
          )
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}

// ============================================================================
// CARD
// ============================================================================

function PickingOrderCard({
  picking,
}: {
  picking: PickingOrder;
}) {
  const formattedDate =
    new Date(
      picking.created_at,
    ).toLocaleString(
      'es-MX',
      {
        year:
          'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute:
          '2-digit',
      },
    );

  return (
    <Link
      href={`/mobile/picking/${picking.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm text-gray-500">
            Pedido
          </div>

          <div className="mt-1 text-xl font-bold text-gray-900">
            {
              picking.sales_order_id
            }
          </div>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
            picking.status,
          )}`}
        >
          {getStatusLabel(
            picking.status,
          )}
        </span>
      </div>

      <div className="mt-5 border-t pt-4 text-xs text-gray-500">
        <div>
          ID:
          {' '}
          {picking.id.slice(
            0,
            8,
          )}
          ...
        </div>

        <div className="mt-1">
          {formattedDate}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-sm font-medium text-blue-600">
          Iniciar picking
        </div>

        <div className="text-xl text-blue-600">
          →
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      <div className="text-6xl">
        📦
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No hay pickings
        pendientes
      </h3>

      <p className="mt-2 text-gray-600">
        Las nuevas órdenes
        aparecerán aquí
        automáticamente.
      </p>

      <Link
        href="/mobile/picking"
        className="mt-6 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Actualizar
      </Link>
    </div>
  );
}
