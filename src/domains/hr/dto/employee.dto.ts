import type { Employee }
from '../types/employee.type';

export function employeeDto(
  data: any
): Employee {

  return {

    id: data.id,

    full_name:
      data.full_name,

    email:
      data.email,

    role:
      data.role,

    department:
      data.department,

    salary:
      data.salary,

    is_active:
      data.is_active,

    created_at:
      data.created_at
  };
}

