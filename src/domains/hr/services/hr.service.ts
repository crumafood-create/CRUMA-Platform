import 'server-only';

import { getEmployees }
from '../repositories/hr.repository';

export async function fetchEmployees() {

  return getEmployees();
}


