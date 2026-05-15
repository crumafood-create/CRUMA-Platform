import Link from 'next/link';

import type { Order }
from '../types/order.type';

import { OrderStatusBadge }
from './order-status-badge';

import { ResponsiveTableWrapper }
from '@/shared/components/responsive-table-wrapper';

interface Props {

  orders: Order[];
}

export function OrdersTable({
  orders
}: Props) {

  return (

    <ResponsiveTableWrapper>

      <div className="overflow-hidden rounded-2xl border">

        <table className="w-full">

          <thead className="border-b bg-gray-50">

            <tr>

              <th className="p-4 text-left">

                Pedido

              </th>

              <th className="p-4 text-left">

                Cliente

              </th>

              <th className="p-4 text-left">

                Pago

              </th>

              <th className="p-4 text-left">

                Estado

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

                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="text-blue-600 hover:underline"
                  >

                    #{order.id}

                  </Link>

                </td>

                <td className="p-4">

                  {order.full_name}

                </td>

                <td className="p-4">

                  <OrderStatusBadge
                    status={order.payment_status}
                  />

                </td>

                <td className="p-4">

                  <OrderStatusBadge
                    status={order.status}
                  />

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </ResponsiveTableWrapper>
  );
}
