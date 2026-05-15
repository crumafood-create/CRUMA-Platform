import { fetchProductionOrders }
from '@/domains/manufacturing/services/manufacturing.service';

import { ProductionOrdersTable }
from '@/domains/manufacturing/components/production-orders-table';

import { ProductionMetrics }
from '@/domains/manufacturing/components/production-metrics';

export default async function ManufacturingPage() {

  const orders =
    await fetchProductionOrders();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Producción

        </h1>

      </div>

      <ProductionOrdersTable
        orders={orders}
      />

    </main>
  );
}
