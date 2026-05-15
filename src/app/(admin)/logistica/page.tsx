import { fetchDeliveries }
from '@/domains/logistics/services/logistics.service';

import { DeliveriesTable }
from '@/domains/logistics/components/deliveries-table';

import { DeliveryMetrics }
from '@/domains/logistics/components/delivery-metrics';

export default async function LogisticsPage() {

  const deliveries =
    await fetchDeliveries();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Logística

        </h1>

      </div>

      <DeliveriesTable
        deliveries={deliveries}
      />

    </main>
  );
}
