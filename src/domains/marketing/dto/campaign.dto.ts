import type { Campaign }
from '../types/campaign.type';

export function campaignDto(
  data: any
): Campaign {

  return {

    id: data.id,

    name: data.name,

    channel: data.channel,

    status: data.status,

    audience_size:
      data.audience_size,

    sent_count:
      data.sent_count,

    created_at:
      data.created_at
  };
}


