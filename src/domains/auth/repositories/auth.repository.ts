import { createClient }
from '@/infrastructure/supabase/client';

export async function loginRepository(
  email: string,
  password: string
) {

  const supabase = createClient();

  return supabase.auth.signInWithPassword({

    email,

    password
  });
}

export async function logoutRepository() {

  const supabase = createClient();

  return supabase.auth.signOut();
}
