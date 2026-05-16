import type { B2BCustomer }
from '../types/b2b-customer.type';

interface Props {

  customers: B2BCustomer[];
}

export function B2BCustomersTable({
  customers
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Empresa

            </th>

            <th className="p-4 text-left">

              Contacto

            </th>

            <th className="p-4 text-left">

              Tier

            </th>

            <th className="p-4 text-left">

              Crédito

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

                {customer.company_name}

              </td>

              <td className="p-4">

                {customer.contact_name}

              </td>

              <td className="p-4">

                {customer.pricing_tier}

              </td>

              <td className="p-4">

                ${customer.credit_limit}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}
