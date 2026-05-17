import 'server-only';

import { getCampaigns }
from '../repositories/marketing.repository';

export async function fetchCampaigns() {

  return getCampaigns();
}

