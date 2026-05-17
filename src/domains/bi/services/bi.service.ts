import 'server-only';

import { getExecutiveSummary }
from '../repositories/bi.repository';

export async function fetchExecutiveSummary() {

  return getExecutiveSummary();
}
