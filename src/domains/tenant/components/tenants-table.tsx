import type { Tenant }
from '../types/tenant.type';

interface Props {

  tenants: Tenant[];
}

export function TenantsTable({
  tenants
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Tenant

            </th>

            <th className="p-4 text-left">

              Slug

            </th>

            <th className="p-4 text-left">

              Estado

            </th>

          </tr>

        </thead>

        <tbody>

          {tenants.map(tenant => (

            <tr
              key={tenant.id}
              className="border-b"
            >

              <td className="p-4">

                {tenant.name}

              </td>

              <td className="p-4">

                {tenant.slug}

              </td>

              <td className="p-4">

                {tenant.is_active
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
