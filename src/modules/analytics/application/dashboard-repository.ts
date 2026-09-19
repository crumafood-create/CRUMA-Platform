import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import { requireRows } from '@/lib/database/query-result';

import {
  buildDashboardSummary,
  type DashboardSummary,
} from './dashboard-summary';
import type { DashboardFilters } from './dashboard-filters';

export type DashboardFilterOptions = {
  warehouses: Array<{ id: string; name: string }>;
  profiles: Array<{ id: string; full_name: string | null; email: string | null }>;
};

export async function loadDashboardFilterOptions(
  client: TypedSupabaseClient,
): Promise<DashboardFilterOptions> {
  const [warehouses, profiles] = await Promise.all([
    client.from('warehouses').select('id, name').eq('is_active', true).order('name'),
    client.from('profiles').select('id, full_name, email').order('full_name'),
  ]);
  const resource = 'filtros del dashboard';
  return {
    warehouses: requireRows(warehouses, resource),
    profiles: requireRows(profiles, resource),
  };
}

export async function loadDashboardSummary(
  client: TypedSupabaseClient,
  filters: DashboardFilters,
  now = new Date(),
): Promise<DashboardSummary> {
  let salesQuery = client
    .from('sales_orders')
    .select('total')
    .gte('created_at', filters.from)
    .lte('created_at', filters.to)
    .eq('status', 'delivered');
  let stockQuery = client.from('inventory_stock_by_item').select('item_type, quantity');
  let productionQuery = client
    .from('production_orders')
    .select('production_status, planned_start_at')
    .gte('created_at', filters.from)
    .lte('created_at', filters.to);

  if (filters.warehouseId) {
    stockQuery = stockQuery.eq('warehouse_id', filters.warehouseId);
    productionQuery = productionQuery.eq('warehouse_id', filters.warehouseId);
  }
  if (filters.userId) productionQuery = productionQuery.eq('created_by', filters.userId);

  const [sales, receivables, stock, production, forecasts] = await Promise.all([
    salesQuery,
    client.from('accounts_receivable').select('balance').eq('status', 'pending'),
    stockQuery,
    productionQuery,
    client.from('demand_forecasts').select('suggested_production')
      .gte('calculated_at', filters.from).lte('calculated_at', filters.to),
  ]);
  const resource = 'indicadores del dashboard';

  return buildDashboardSummary({
    sales: requireRows(sales, resource),
    receivables: requireRows(receivables, resource),
    stock: requireRows(stock, resource),
    production: requireRows(production, resource),
    forecasts: requireRows(forecasts, resource),
  }, now);
}
