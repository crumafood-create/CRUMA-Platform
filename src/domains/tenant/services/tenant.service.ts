import 'server-only';

import { getTenants }
from '../repositories/tenant.repository';

export async function fetchTenants() {

  return getTenants();
}
