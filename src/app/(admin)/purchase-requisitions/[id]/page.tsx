import Link from 'next/link';

import {
  approvePurchaseRequisition,
  convertToPurchaseOrder,
} from '../actions';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function PurchaseRequisitionPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const {
    data: requisition,
  } = await supabase
    .from(
      'purchase_requisitions',
    )
    .select('*')
    .eq('id', id)
    .single();

  const {
    data: items,
  } = await supabase
    .from(
      'purchase_requisition_items',
    )
    .select(`
      *,
      raw_materials (
        name
      )
    `)
    .eq(
      'purchase_requisition_id',
      id,
    );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Requisición
        </h1>

        <Link
          href="/purchase-requisitions"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        <div>
          Número:{' '}
          {
            requisition?.requisition_number
          }
        </div>

        <div>
          Estado:{' '}
          {
            requisition?.status
          }
        </div>
      </div>

      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Materiales
        </h2>

        <div className="space-y-3">
          {items?.map(
            (
              item: any,
            ) => (
              <div
                key={
                  item.id
                }
                className="rounded border p-3"
              >
                <div className="font-semibold">
                  {
                    item.raw_materials
                      ?.name
                  }
                </div>

                <div>
                  Requerido:{' '}
                  {
                    item.required_quantity
                  }
                </div>

                <div>
                  Disponible:{' '}
                  {
                    item.available_quantity
                  }
                </div>

                <div className="font-semibold text-red-600">
                  Comprar:{' '}
                  {
                    item.purchase_quantity
                  }
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {requisition?.status ===
          'draft' && (
          <form
            action={approvePurchaseRequisition.bind(
              null,
              id,
            )}
          >
            <button className="rounded border px-4 py-2">
              Aprobar
            </button>
          </form>
        )}

        {requisition?.status ===
          'approved' && (
          <form
            action={convertToPurchaseOrder.bind(
              null,
              id,
            )}
          >
            <button className="rounded border px-4 py-2">
              Crear Orden de Compra
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
