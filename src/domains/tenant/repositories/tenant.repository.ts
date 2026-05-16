import { createClient }
from '@/infrastructure/supabase/server';

import { tenantDto }
from '../dto/tenant.dto';

export async function getTenants() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('tenants')

      .select(`
        id,
        name,
        slug,
        is_active,
        created_at
      `);

  if (error) {
    throw error;
  }

  return data.map(
    tenantDto
  );
}
