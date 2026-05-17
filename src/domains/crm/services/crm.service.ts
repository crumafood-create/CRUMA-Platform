import 'server-only';

import { getCustomerProfiles }
from '../repositories/crm.repository';

export async function fetchCustomerProfiles() {

  return getCustomerProfiles();
}
