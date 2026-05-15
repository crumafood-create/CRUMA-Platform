import type { InventoryLevel }
from '../types/inventory-level.type';

import { LowStockAlert }
from './low-stock-alert';

interface Props {

  inventory: InventoryLevel[];
}

export function InventoryTable({
  inventory
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Product ID

            </th>

            <th className="p-4 text-left">

              Warehouse

            </th>

            <th className="p-4 text-left">

              Disponible

            </th>

            <th className="p-4 text-left">

              Reservado

            </th>

          </tr>

        </thead>

        <tbody>

          {inventory.map(item => (

            <tr
              key={item.id}
              className="border-b"
            >

              <td className="p-4">

                {item.product_id}

              </td>

              <td className="p-4">

                {item.warehouse_id}

              </td>

              <td className="p-4">

                {item.available_quantity}

              </td>

              <td className="p-4">

                {item.reserved_quantity}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}
