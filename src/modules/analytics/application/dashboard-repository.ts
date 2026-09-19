import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import { requireRows } from '@/lib/database/query-result';

import {
  buildDashboardSummary,
  type DashboardSummary,
} from './dashboard-summary';

export async function loadDashboardSummary(
  client: TypedSupabaseClient,
  now = new Date(),
): Promise<DashboardSummary> {
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const [sales, receivables, stock, production, forecasts] = await Promise.all([
    client.from('sales_orders').select('total').gte('created_at', firstDay).eq('status', 'delivered'),
    client.from('accounts_receivable').select('balance').eq('status', 'pending'),
    client.from('inventory_stock_by_item').select('item_type, quantity'),
    client.from('production_orders').select('production_status'),
    client.from('demand_forecasts').select('suggested_production'),
  ]);
  const resource = 'indicadores del dashboard';

  return buildDashboardSummary({
    sales: requireRows(sales, resource),
    receivables: requireRows(receivables, resource),
    stock: requireRows(stock, resource),
    production: requireRows(production, resource),
    forecasts: requireRows(forecasts, resource),
  });
}
