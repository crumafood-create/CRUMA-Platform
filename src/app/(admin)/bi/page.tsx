import { fetchExecutiveSummary }
from '@/domains/bi/services/bi.service';

import { KPICard }
from '@/domains/bi/components/kpi-card';

export default async function BIPage() {

  const summary =
    await fetchExecutiveSummary();

  return (

    <main className="space-y-8">

      <div>

        <h1 className="text-4xl font-bold">

          Executive BI

        </h1>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <KPICard
          kpi={{
            title: 'Revenue',
            value: summary.revenue,
            change_percentage: 12,
            trend: 'up'
          }}
        />

        <KPICard
          kpi={{
            title: 'Orders',
            value: summary.orders,
            change_percentage: 8,
            trend: 'up'
          }}
        />

        <KPICard
          kpi={{
            title: 'Customers',
            value: summary.customers,
            change_percentage: 6,
            trend: 'up'
          }}
        />

        <KPICard
          kpi={{
            title: 'Inventory',
            value: summary.inventory_value,
            change_percentage: -2,
            trend: 'down'
          }}
        />

      </div>

    </main>
  );
}
