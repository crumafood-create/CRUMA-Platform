import 'server-only';

import { createClient }
from '@/infrastructure/supabase/server';

import { campaignDto }
from '../dto/campaign.dto';

export async function getCampaigns() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('marketing_campaigns')

      .select(`
        id,
        name,
        channel,
        status,
        audience_size,
        sent_count,
        created_at
      `)

      .order('created_at', {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data.map(
    campaignDto
  );
}


