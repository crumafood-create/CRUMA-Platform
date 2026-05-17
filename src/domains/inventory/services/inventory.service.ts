import 'server-only';

import { getInventoryLevels }
from '../repositories/inventory.repository';

export async function fetchInventoryLevels() {

  return getInventoryLevels();
}
