import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function MobilePickingPage() {
  const supabase =
    await createClient();

  const {
    data: pickings,
  } = await supabase
    .from(
      'picking_orders',
    )
    .select(`
      id,
      status,
      sales_order_id
    `)
    .order(
      'created_at',
      {
        ascending:
          false,
      },
    );

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">
        Picking
      </h1>

      <div className="space-y-4">
        {pickings?.map(
          (
            picking,
          ) => (
            <Link
              key={
                picking.id
              }
              href={`/mobile/picking/${picking.id}`}
              className="block rounded-2xl border p-6"
            >
              <div className="font-semibold">
                Pedido
              </div>

              <div className="mt-2 text-sm text-gray-500">
                {
                  picking.sales_order_id
                }
              </div>

              <div className="mt-4">
                Estado:{' '}
                {
                  picking.status
                }
              </div>

              <div className="rounded border p-4">
  <div className="font-semibold">
    {product?.name}
  </div>

  <div className="mt-3">
    Cantidad:
    {' '}
    {item.quantity}
  </div>

  <div>
    Ubicación:
    {' '}
    {suggested?.location_name}
  </div>

  <div>
    Lote:
    {' '}
    {suggested?.lot_number}
  </div>

  <div>
    Disponible:
    {' '}
    {suggested?.quantity}
  </div>
</div>
              <input
  value={scannedLot}
  onChange={(e) =>
    setScannedLot(
      e.target.value,
    )
  }
  placeholder="Escanea el lote"
  className="w-full rounded border p-3"
/>
              <button
  onClick={confirmPicking}
  className="rounded border px-4 py-2"
>
  Confirmar Picking
</button>

              if (
  scannedLot !==
  suggested.lot_number
) {
  throw new Error(
    'Lote incorrecto',
  );
              }
            </Link>
          ),
        )}

        {!pickings
          ?.length && (
          <div className="rounded-2xl border p-6 text-gray-500">
            No hay pickings pendientes.
          </div>
        )}
      </div>
    </main>
  );
}
