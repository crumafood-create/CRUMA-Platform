import type { Invoice }
from '../types/invoice.type';

interface Props {

  invoices: Invoice[];
}

export function InvoicesTable({
  invoices
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Factura

            </th>

            <th className="p-4 text-left">

              Cliente

            </th>

            <th className="p-4 text-left">

              Estado

            </th>

            <th className="p-4 text-left">

              Total

            </th>

          </tr>

        </thead>

        <tbody>

          {invoices.map(invoice => (

            <tr
              key={invoice.id}
              className="border-b"
            >

              <td className="p-4">

                {invoice.invoice_number}

              </td>

              <td className="p-4">

                {invoice.customer_name}

              </td>

              <td className="p-4">

                {invoice.status}

              </td>

              <td className="p-4">

                ${invoice.total_amount}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}


