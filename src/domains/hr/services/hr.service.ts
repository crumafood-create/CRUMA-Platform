import { getEmployees }
from '../repositories/hr.repository';

export async function fetchEmployees() {

  return getEmployees();
}


