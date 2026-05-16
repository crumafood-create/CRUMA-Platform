ts
export interface Campaign {

  id: string;

  name: string;

  channel: string;

  status: string;

  audience_size: number | null;

  sent_count: number | null;

  created_at: string;
}


