import { fetchOrders }
from '@/domains/orders/services/orders.service';

import { OrdersTable }
from '@/domains/orders/components/orders-table';

export default async function OrdersPage() {

  const orders = await fetchOrders();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Pedidos

        </h1>

      </div>

      <OrdersTable
        orders={orders}
      />

    </main>
  );
}
