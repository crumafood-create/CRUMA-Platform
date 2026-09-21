'use server';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

const SAFE_PATH = /^\/[a-zA-Z0-9/_-]{0,200}$/;
const SAFE_SESSION = /^[a-f0-9-]{16,64}$/i;

export async function trackAnalyticsPageView(input: {
  area: 'admin' | 'mobile';
  page: string;
  sessionId: string;
}): Promise<void> {
  if (!SAFE_PATH.test(input.page) || !SAFE_SESSION.test(input.sessionId)) return;
  const supabase = await createTypedClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('analytics_events').insert({
    user_id: user.id,
    session_id: input.sessionId,
    event_type: 'page_view',
    entity_type: input.area,
    page: input.page,
    metadata: { area: input.area },
  });
}
