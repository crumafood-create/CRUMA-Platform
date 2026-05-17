import 'server-only';

import { getGlobalUsers }
from '../repositories/super-admin.repository';

export async function fetchGlobalUsers() {

  return getGlobalUsers();
}
