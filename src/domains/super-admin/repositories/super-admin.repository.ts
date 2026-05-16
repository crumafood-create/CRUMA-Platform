import { createClient }
from '@/infrastructure/supabase/server';

import { globalUserDto }
from '../dto/global-user.dto';

export async function getGlobalUsers() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('global_users')

      .select(`
        id,
        full_name,
        email,
        role,
        tenant_id,
        is_active
      `)

      .order('full_name');

  if (error) {
    throw error;
  }

  return data.map(
    globalUserDto
  );
}
