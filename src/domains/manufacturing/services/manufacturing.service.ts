import 'server-only';

import { getProductionOrders }
from '../repositories/manufacturing.repository';

export async function fetchProductionOrders() {

  return getProductionOrders();
}
