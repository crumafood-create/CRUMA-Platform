import type { GlobalUser }
from '../types/global-user.type';

interface Props {

  users: GlobalUser[];
}

export function GlobalUsersTable({
  users
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Usuario

            </th>

            <th className="p-4 text-left">

              Email

            </th>

            <th className="p-4 text-left">

              Rol

            </th>

            <th className="p-4 text-left">

              Tenant

            </th>

          </tr>

        </thead>

        <tbody>

          {users.map(user => (

            <tr
              key={user.id}
              className="border-b"
            >

              <td className="p-4">

                {user.full_name}

              </td>

              <td className="p-4">

                {user.email}

              </td>

              <td className="p-4">

                {user.role}

              </td>

              <td className="p-4">

                {user.tenant_id}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}
