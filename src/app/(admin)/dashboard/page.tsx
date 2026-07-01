import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function DashboardPage() {
  const supabase =
    await createClient();

  const now = new Date();

  const firstDay =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();

  const [
    { data: sales },
    { data: receivables },
    { data: stock },
    { data: production },
    { data: forecasts },
  ] = await Promise.all([
    supabase
      .from('sales_orders')
      .select(`
        total,
        created_at
      `)
      .gte(
        'created_at',
        firstDay,
      )
      .eq(
        'status',
        'delivered',
      ),

    supabase
      .from(
        'accounts_receivable',
      )
      .select(`
        balance,
        status
      `)
      .eq(
        'status',
        'pending',
      ),

    supabase
      .from(
        'inventory_stock_by_item',
      )
      .select(`
        item_type,
        quantity
      `),

    supabase
      .from(
        'production_orders',
      )
      .select(`
        production_status
      `),

    supabase
      .from(
        'demand_forecasts',
      )
      .select(`
        suggested_production
      `),
  ]);

  const salesMonth =
    (sales ?? []).reduce(
      (sum, row) =>
        sum +
        Number(
          row.total ?? 0,
        ),
      0,
    );

  const receivableBalance =
    (
      receivables ?? []
    ).reduce(
      (sum, row) =>
        sum +
        Number(
          row.balance ?? 0,
        ),
      0,
    );

  const productCount =
    (
      stock ?? []
    ).filter(
      (row) =>
        row.item_type ===
          'product' &&
        Number(
          row.quantity,
        ) > 0,
    ).length;

  const materialCount =
    (
      stock ?? []
    ).filter(
      (row) =>
        row.item_type ===
          'raw_material' &&
        Number(
          row.quantity,
        ) > 0,
    ).length;

  const criticalCount =
    (
      stock ?? []
    ).filter(
      (row) =>
        Number(
          row.quantity,
        ) <= 0,
    ).length;

  const openProduction =
    (
      production ?? []
    ).filter(
      (row) =>
        row.production_status !==
          'completed' &&
        row.production_status !==
          'cancelled',
    ).length;

  const completedProduction =
    (
      production ?? []
    ).filter(
      (row) =>
        row.production_status ===
        'completed',
    ).length;

  const productsToProduce =
    (
      forecasts ?? []
    ).filter(
      (row) =>
        Number(
          row.suggested_production,
        ) > 0,
    ).length;

  const suggestedProduction =
    (
      forecasts ?? []
    ).reduce(
      (sum, row) =>
        sum +
        Number(
          row.suggested_production ??
            0,
        ),
      0,
    );

  const cards = [
    {
      title:
        'Ventas del Mes',
      value:
        `$${salesMonth.toFixed(
          2,
        )}`,
    },
    {
      title:
        'Por Cobrar',
      value:
        `$${receivableBalance.toFixed(
          2,
        )}`,
    },
    {
      title:
        'Productos con Stock',
      value:
        productCount.toString(),
    },
    {
      title:
        'Materias Primas',
      value:
        materialCount.toString(),
    },
    {
      title:
        'Materiales Críticos',
      value:
        criticalCount.toString(),
    },
    {
      title:
        'Órdenes Abiertas',
      value:
        openProduction.toString(),
    },
    {
      title:
        'Órdenes Completadas',
      value:
        completedProduction.toString(),
    },
    {
      title:
        'Productos por Producir',
      value:
        productsToProduce.toString(),
    },
    {
      title:
        'Producción Sugerida',
      value:
        suggestedProduction.toFixed(
          2,
        ),
    },
  ];

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Dashboard Ejecutivo
        </h1>

        <p className="mt-2 text-gray-500">
          Resumen general
          de la operación.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {cards.map(
          (card) => (
            <div
              key={
                card.title
              }
              className="rounded-2xl border bg-white p-6"
            >
              <div className="text-sm text-gray-500">
                {card.title}
              </div>

              <div className="mt-3 text-3xl font-bold">
                {card.value}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/sales-orders"
          className="rounded-2xl border p-6 hover:bg-gray-50"
        >
          🛒 Ventas
        </Link>

        <Link
          href="/production-orders"
          className="rounded-2xl border p-6 hover:bg-gray-50"
        >
          🏭 Producción
        </Link>

        <Link
          href="/inventory-stock"
          className="rounded-2xl border p-6 hover:bg-gray-50"
        >
          📦 Inventario
        </Link>

        <Link
          href="/demand-forecasts"
          className="rounded-2xl border p-6 hover:bg-gray-50"
        >
          📈 Forecast
        </Link>

        <div className="rounded-2xl border bg-white p-6">
  <h2 className="mb-4 text-xl font-semibold">
    Alertas
  </h2>

  <div className="space-y-3">
    {criticalCount > 0 && (
      <div className="rounded border border-red-300 bg-red-50 p-3">
        ⚠️
        Hay {criticalCount}
        materiales sin stock.
      </div>
    )}

    {productsToProduce > 0 && (
      <div className="rounded border border-orange-300 bg-orange-50 p-3">
        📈
        Hay {productsToProduce}
        productos que necesitan producción.
      </div>
    )}

    {receivableBalance > 0 && (
      <div className="rounded border border-yellow-300 bg-yellow-50 p-3">
        💰
        Existen $
        {receivableBalance.toFixed(2)}
        pendientes por cobrar.
      </div>
    )}
  </div>
</div>
      </div>
    </main>
  );
}
