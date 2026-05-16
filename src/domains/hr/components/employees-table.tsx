import type { Employee }
from '../types/employee.type';

interface Props {

  employees: Employee[];
}

export function EmployeesTable({
  employees
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Empleado

            </th>

            <th className="p-4 text-left">

              Rol

            </th>

            <th className="p-4 text-left">

              Departamento

            </th>

            <th className="p-4 text-left">

              Estado

            </th>

          </tr>

        </thead>

        <tbody>

          {employees.map(employee => (

            <tr
              key={employee.id}
              className="border-b"
            >

              <td className="p-4">

                {employee.full_name}

              </td>

              <td className="p-4">

                {employee.role}

              </td>

              <td className="p-4">

                {employee.department}

              </td>

              <td className="p-4">

                {employee.is_active
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


