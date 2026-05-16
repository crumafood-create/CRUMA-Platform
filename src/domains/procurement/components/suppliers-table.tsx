ñimport type { Supplier }
from '../types/supplier.type';

interface Props {

  suppliers: Supplier[];
}

export function SuppliersTable({
  suppliers
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

              Email

            </th>

            <th className="p-4 text-left">

              Estado

            </th>

          </tr>

        </thead>

        <tbody>

          {suppliers.map(supplier => (

            <tr
              key={supplier.id}
              className="border-b"
            >

              <td className="p-4">

                {supplier.company_name}

              </td>

              <td className="p-4">

                {supplier.contact_name}

              </td>

              <td className="p-4">

                {supplier.email}

              </td>

              <td className="p-4">

                {supplier.is_active
                  ? 'Activo'
                  : 'Inactivo'}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}
