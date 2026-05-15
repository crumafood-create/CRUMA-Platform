import { createClient }
from '@/infrastructure/supabase/server';

export async function getDashboardKpis() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('dashboard_sales_summary')

      .select('*')

      .single();

  if (error) {
    throw error;
  }

  return {

    totalRevenue:
      data.total_revenue || 0,

    totalOrders:
      data.total_orders || 0,

    averageOrderValue:
      data.average_order_value || 0
  };
}
