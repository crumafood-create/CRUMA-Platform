import {
  fetchDashboardKpis,
  fetchSalesChart
}
from '@/domains/analytics/services/analytics.service';

import { KpiCard }
from '@/domains/analytics/components/kpi-card';

import { SalesChart }
from '@/domains/analytics/charts/sales-chart';

export default async function AnalyticsPage() {

  const [
    kpis,
    salesChart
  ] = await Promise.all([

    fetchDashboardKpis(),

    fetchSalesChart()
  ]);

  return (

    <main className="space-y-8">

      <div>

        <h1 className="text-4xl font-bold">

          Analytics

        </h1>

      </div>

      <div className="grid gap-6 md:grid-cols-3">

        <KpiCard
          title="Revenue"
          value={`$${kpis.totalRevenue}`}
        />

        <KpiCard
          title="Orders"
          value={String(
            kpis.totalOrders
          )}
        />

        <KpiCard
          title="AOV"
          value={`$${kpis.averageOrderValue}`}
        />

      </div>

      <SalesChart
        data={salesChart}
      />

    </main>
  );
}





