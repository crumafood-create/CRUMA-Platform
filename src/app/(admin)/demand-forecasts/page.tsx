import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';
import { requireRows } from '@/modules/core/application/critical-read';

import { calculateDemandForecasts } from './actions';

type Product = {
  id: string;
  name: string;
  internal_code: string | null;
};

export default async function DemandForecastsPage() {
  const supabase =
    await createClient();

  const forecastsResult = await supabase
    .from('demand_forecasts')
    .select('*')
    .order(
      'suggested_production',
      {
        ascending: false,
      },
    );

  const forecasts = requireRows(
    forecastsResult,
    'pronósticos de demanda',
  );

  const productIds =
    forecasts?.map(
      (row) =>
        row.product_id,
    ) ?? [];

  const productsResult =
    productIds.length > 0
      ? await supabase
          .from('products')
          .select(`
            id,
            name,
            internal_code
          `)
          .in(
            'id',
            productIds,
          )
      : {
          data: [],
          error: null,
        };

  const products = requireRows(
    productsResult,
    'pronósticos de demanda',
  );

  const productMap =
    new Map(
      (
        products ??
        []
      ).map(
        (
          product: Product,
        ) => [
          product.id,
          product,
        ],
      ),
    );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Pronóstico de Demanda
          </h1>

          <p className="mt-2 text-gray-500">
            Forecast de ventas y producción sugerida
          </p>
        </div>

        <form
          action={
            calculateDemandForecasts
          }
        >
          <button
            type="submit"
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Calcular Pronóstico
          </button>
        </form>
      </div>

      <div className="rounded-2xl border p-6">
        {forecasts?.length ? (
          <div className="space-y-3">
            {forecasts.map(
              (
                row,
              ) => {
                const product =
                  productMap.get(
                    row.product_id,
                  );

                return (
                  <div
                    key={
                      row.id
                    }
                    className="rounded border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {product?.name ??
                            'Producto'}
                        </div>

                        <div className="text-sm text-gray-500">
                          {product?.internal_code ??
                            '-'}
                        </div>
                      </div>

                      <Link
                        href={`/demand-forecasts/${row.product_id}`}
                        className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Ver
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Promedio Diario
                        </div>

                        <div className="text-xl font-bold">
                          {Number(
                            row.average_daily_demand ??
                              0,
                          ).toFixed(
                            2,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">
                          Pronóstico
                        </div>

                        <div className="text-xl font-bold">
                          {Number(
                            row.forecast_quantity ??
                              0,
                          ).toFixed(
                            2,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">
                          Stock
                        </div>

                        <div className="text-xl font-bold">
                          {Number(
                            row.stock_quantity ??
                              0,
                          ).toFixed(
                            2,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">
                          Producir
                        </div>

                        <div
                          className={`text-xl font-bold ${
                            Number(
                              row.suggested_production ??
                                0,
                            ) > 0
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}
                        >
                          {Number(
                            row.suggested_production ??
                              0,
                          ).toFixed(
                            2,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            No hay pronósticos calculados.
          </p>
        )}
      </div>
    </main>
  );
}
