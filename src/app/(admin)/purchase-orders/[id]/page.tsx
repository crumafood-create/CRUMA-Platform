import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import {
  releasePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from '../actions';

function getStatusLabel(
  status: string
): string {
  switch (status) {
    case 'draft':
      return 'Borrador';

    case 'released':
      return 'Liberada';

    case 'partially_received':
      return 'Parcialmente Recibida';

    case 'received':
      return 'Recibida';

    case 'cancelled':
      return 'Cancelada';

    default:
      return status;
  }
}

export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase =
    await createClient();

  const { data: order } =
    await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

  if (!order) {
    notFound();
  }

  const { data: supplier } =
    await supabase
      .from('suppliers')
      .select('id, name')
      .eq(
        'id',
        order.supplier_id
      )
      .single();

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Compra
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {order.order_number}
          </p>
        </div>

        <Link
          href="/purchase-orders"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">
              Proveedor
            </div>

            <div className="font-semibold">
              {supplier?.name ??
                '-'}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Fecha
            </div>

            <div className="font-semibold">
              {order.order_date}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Fecha Esperada
            </div>

            <div className="font-semibold">
              {order.expected_date ??
                '-'}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Estado
            </div>

            <div className="font-semibold">
              {getStatusLabel(
                order.status
              )}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Total
            </div>

            <div className="font-semibold">
              $
              {Number(
                order.total ?? 0
              ).toFixed(2)}
            </div>
          </div>

          {order.notes && (
            <div>
              <div className="text-sm text-gray-500">
                Notas
              </div>

              <div>
                {order.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/purchase-orders/${order.id}/items`}
          className="rounded border px-4 py-2"
        >
          Ver Items
        </Link>

        {order.status ===
          'draft' && (
          <form
            action={releasePurchaseOrder.bind(
              null,
              order.id
            )}
          >
            <button
              type="submit"
              className="rounded border px-4 py-2"
            >
              Liberar Compra
            </button>
          </form>
        )}

        {(order.status ===
          'released' ||
          order.status ===
            'partially_received') && (
          <form
            action={receivePurchaseOrder.bind(
              null,
              order.id
            )}
          >
            <button
              type="submit"
              className="rounded border bg-green-50 px-4 py-2 text-green-700"
            >
              Recibir Compra
            </button>
          </form>
        )}

        {order.status !==
          'received' &&
          order.status !==
            'cancelled' && (
            <form
              action={cancelPurchaseOrder.bind(
                null,
                order.id
              )}
            >
              <button
                type="submit"
                className="rounded border border-red-300 px-4 py-2 text-red-700"
              >
                Cancelar
              </button>
            </form>
          )}
      </div>
    </main>
  );
}
