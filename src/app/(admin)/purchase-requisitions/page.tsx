import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import {
  generatePurchaseRequisition,
} from './actions';

export default async function PurchaseRequisitionsPage() {
  const supabase =
    await createClient();

  const {
    data: requisitions,
  } = await supabase
    .from(
      'purchase_requisitions',
    )
    .select('*')
    .order(
      'created_at',
      {
        ascending: false,
      },
    );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Requisiciones
        </h1>

        <form
          action={
            generatePurchaseRequisition
          }
        >
          <button
            className="rounded border px-4 py-2"
          >
            Generar desde MRP
          </button>
        </form>
      </div>

      <div className="rounded-2xl border p-6">
        {requisitions?.length ? (
          <div className="space-y-3">
            {requisitions.map(
              (
                requisition,
              ) => (
                <div
                  key={
                    requisition.id
                  }
                  className="rounded border p-4"
                >
                  <div className="font-semibold">
                    {
                      requisition.requisition_number
                    }
                  </div>

                  <div>
                    Estado:{' '}
                    {
                      requisition.status
                    }
                  </div>

                  <Link
                    href={`/purchase-requisitions/${requisition.id}`}
                    className="mt-2 inline-block rounded border px-3 py-1"
                  >
                    Ver
                  </Link>
                </div>
              ),
            )}
          </div>
        ) : (
          <p>
            No hay requisiciones.
          </p>
        )}
      </div>
    </main>
  );
}
