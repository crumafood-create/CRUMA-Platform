import { createClient } from '@/infrastructure/integrations/supabase/server';

import { DashboardCard } from './_components/dashboard-card';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: deliveredOrders },
    { data: profits },
    { data: receivables },
    { data: productionOrders },
    { data: purchaseOrders },
    { data: stock },
  ] = await Promise.all([
    supabase
      .from('sales_orders')
      .select(
        'total, created_at',
      )
      .eq(
        'status',
        'delivered',
      ),

    supabase
      .from(
        'sales_order_profit',
      )
      .select(
        'gross_profit, created_at',
      ),

    supabase
      .from(
        'accounts_receivable',
      )
      .select(
        'balance, status',
      )
      .in(
        'status',
        [
          'pending',
          'partial',
        ],
      ),

    supabase
      .from(
        'production_orders',
      )
      .select(
        'status',
      )
      .in(
        'status',
        [
          'released',
          'in_progress',
        ],
      ),

    supabase
      .from(
        'purchase_orders',
      )
      .select(
        'status',
      )
      .in(
        'status',
        [
          'draft',
          'sent',
          'partial',
        ],
      ),

    supabase
      .from(
        'inventory_stock_by_item',
      )
      .select(
        'quantity, item_type, item_id',
      )
      .eq(
        'item_type',
        'raw_material',
      ),
  ]);

  const currentMonth =
    new Date().getMonth();

  const currentYear =
    new Date().getFullYear();

  const salesThisMonth =
    (deliveredOrders ?? [])
      .filter((row) => {
        const date =
          new Date(
            row.created_at,
          );

        return (
          date.getMonth() ===
            currentMonth &&
          date.getFullYear() ===
            currentYear
        );
      })
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.total,
          ),
        0,
      );

  const profitThisMonth =
    (profits ?? [])
      .filter((row) => {
        const date =
          new Date(
            row.created_at,
          );

        return (
          date.getMonth() ===
            currentMonth &&
          date.getFullYear() ===
            currentYear
        );
      })
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.gross_profit,
          ),
        0,
      );

  const receivableBalance =
    (receivables ?? [])
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.balance,
          ),
        0,
      );

  const activeProduction =
    productionOrders
      ?.length ?? 0;

  const pendingPurchases =
    purchaseOrders
      ?.length ?? 0;

  const totalRawStock =
    (stock ?? [])
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.quantity,
          ),
        0,
      );

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-500">
          Resumen ejecutivo
          de CRUMAFOOD
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <DashboardCard
          title="Ventas del Mes"
          value={`$${salesThisMonth.toFixed(
            2,
          )}`}
        />

        <DashboardCard
          title="Utilidad del Mes"
          value={`$${profitThisMonth.toFixed(
            2,
          )}`}
        />

        <DashboardCard
          title="Por Cobrar"
          value={`$${receivableBalance.toFixed(
            2,
          )}`}
        />

        <DashboardCard
          title="Producción Activa"
          value={
            activeProduction
          }
        />

        <DashboardCard
          title="Compras Pendientes"
          value={
            pendingPurchases
          }
        />

        <DashboardCard
          title="Stock Materia Prima"
          value={totalRawStock.toFixed(
            2,
          )}
        />
      </div>
    </main>
  );
}
