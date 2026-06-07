import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function getUserRole(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) return null;

  return data?.role ?? null;
}
