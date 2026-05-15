import { fetchOrder }
from '@/domains/orders/services/orders.service';

interface Props {

  params: Promise<{
    id: string;
  }>;
}

import { ApprovePaymentButton }
from '@/domains/orders/components/approve-payment-button';

export default async function OrderDetailPage({
  params
}: Props) {

  const { id } = await params;

  const order = await fetchOrder(id);

  return (

    <main className="space-y-6">

      <h1 className="text-4xl font-bold">

        Pedido
      </h1>

      <div className="rounded-2xl border p-6">

        <p>
          Cliente:
          {' '}
          {order.full_name}
        </p>

        <p>
          Estado:
          {' '}
          {order.status}
        </p>

        <p>
          Pago:
          {' '}
          {order.payment_status}
        </p>

      </div>

    </main>
  );
}
