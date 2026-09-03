import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import {
  calculateSalesOrderProfit,
} from './actions';

export default async function SalesOrderProfitPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const supabase =
    await createTypedClient();

  const {
    data: profit,
  } = await supabase
    .from(
      'sales_order_profit',
    )
    .select('*')
    .eq(
      'sales_order_id',
      id,
    )
    .maybeSingle();

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Utilidad del Pedido
        </h1>

        <Link
          href={`/sales-orders/${id}`}
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      {!profit ? (
        <div className="rounded-2xl border p-6">
          <p className="mb-4 text-gray-500">
            La utilidad aún no ha sido calculada.
          </p>

          <form
            action={calculateSalesOrderProfit.bind(
              null,
              id,
            )}
          >
            <button
              type="submit"
              className="rounded border px-6 py-2"
            >
              Calcular Utilidad
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border p-6 space-y-6">
          <div>
            <div className="text-sm text-gray-500">
              Venta
            </div>

            <div className="text-2xl font-bold">
              $
              {Number(
                profit.sales_amount,
              ).toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Costo
            </div>

            <div className="text-2xl font-bold">
              $
              {Number(
                profit.cost_amount,
              ).toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Utilidad
            </div>

            <div className="text-2xl font-bold text-green-600">
              $
              {Number(
                profit.gross_profit,
              ).toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">
              Margen
            </div>

            <div className="text-2xl font-bold text-blue-600">
              {Number(
                profit.margin_percent,
              ).toFixed(2)}
              %
            </div>
          </div>

          <form
            action={calculateSalesOrderProfit.bind(
              null,
              id,
            )}
          >
            <button
              type="submit"
              className="rounded border px-6 py-2"
            >
              Recalcular
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
