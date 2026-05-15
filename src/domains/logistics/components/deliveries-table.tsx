import type { Delivery }
from '../types/delivery.type';

import { DeliveryStatusBadge }
from './delivery-status-badge';

interface Props {

  deliveries: Delivery[];
}

export function DeliveriesTable({
  deliveries
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Pedido

            </th>

            <th className="p-4 text-left">

              Estado

            </th>

            <th className="p-4 text-left">

              Repartidor

            </th>

            <th className="p-4 text-left">

              Tracking

            </th>

          </tr>

        </thead>

        <tbody>

          {deliveries.map(delivery => (

            <tr
              key={delivery.id}
              className="border-b"
            >

              <td className="p-4">

                {delivery.order_id}

              </td>

              <td className="p-4">

                <DeliveryStatusBadge
                  status={
                    delivery.status
                  }
                />

              </td>

              <td className="p-4">

                {delivery.driver_name}

              </td>

              <td className="p-4">

                {delivery.tracking_code}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}
