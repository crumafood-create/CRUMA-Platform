import 'server-only';

import { getDeliveries }
from '../repositories/logistics.repository';

export async function fetchDeliveries() {

  return getDeliveries();
}
