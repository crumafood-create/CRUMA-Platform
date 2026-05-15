import { createClient }
from '@/infrastructure/supabase/server';

export async function getSessionUser() {

  const supabase = await createClient();

  const {

    data: { user }
  } = await supabase.auth.getUser();

  return user;
}
