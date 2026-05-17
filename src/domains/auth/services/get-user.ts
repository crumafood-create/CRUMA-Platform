import 'server-only';

import { createClient }
from '@/infrastructure/supabase/server';

export async function getUser() {

  const supabase = await createClient();

  const {

    data: { user }
  } = await supabase.auth.getUser();

  return user;
}
