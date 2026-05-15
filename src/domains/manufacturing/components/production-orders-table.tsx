import type { ProductionOrder }
from '../types/production-order.type';

import { ProductionStatusBadge }
from './production-status-badge';

interface Props {

  orders: ProductionOrder[];
}

export function ProductionOrdersTable({
  orders
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Orden

            </th>

            <th className="p-4 text-left">

              Estado

            </th>

            <th className="p-4 text-left">

              Planeado

            </th>

            <th className="p-4 text-left">

              Producido

            </th>

          </tr>

        </thead>

        <tbody>

          {orders.map(order => (

            <tr
              key={order.id}
              className="border-b"
            >

              <td className="p-4">

                {order.order_number}

              </td>

              <td className="p-4">

                <ProductionStatusBadge
                  status={order.status}
                />

              </td>

              <td className="p-4">

                {order.planned_quantity}

              </td>

              <td className="p-4">

                {order.produced_quantity}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}
