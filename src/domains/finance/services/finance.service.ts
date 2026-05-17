import 'server-only';

import { getInvoices }
from '../repositories/finance.repository';

export async function fetchInvoices() {

  return getInvoices();
}


