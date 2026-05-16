import type { CustomerProfile }
from '../types/customer-profile.type';

interface Props {

  customers: CustomerProfile[];
}

export function CustomerProfilesTable({
  customers
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Cliente

            </th>

            <th className="p-4 text-left">

              Email

            </th>

            <th className="p-4 text-left">

              Órdenes

            </th>

            <th className="p-4 text-left">

              Lifetime Value

            </th>

          </tr>

        </thead>

        <tbody>

          {customers.map(customer => (

            <tr
              key={customer.id}
              className="border-b"
            >

              <td className="p-4">

                {customer.full_name}

              </td>

              <td className="p-4">

                {customer.email}

              </td>

              <td className="p-4">

                {customer.total_orders}

              </td>

              <td className="p-4">

                ${customer.lifetime_value}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}


