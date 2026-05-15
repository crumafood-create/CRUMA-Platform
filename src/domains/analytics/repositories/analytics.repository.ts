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

export async function getSalesChart() {

  const supabase = await createClient();

  const { data, error } =
    await supabase

      .from('dashboard_sales_daily')

      .select('*')

      .order('day', {
        ascending: true
      });

  if (error) {
    throw error;
  }

  return data;
}
