import 'server-only';

import { createClient }
from '@/infrastructure/supabase/server';

export async function getExecutiveSummary() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('dashboard_sales_summary')

      .select(`
        total_revenue,
        total_orders
      `)

      .single();

  if (error) {
    throw error;
  }

  return {

    revenue:
      data.total_revenue ?? 0,

    orders:
      data.total_orders ?? 0,

    customers: 0,

    inventory_value: 0
  };
}
