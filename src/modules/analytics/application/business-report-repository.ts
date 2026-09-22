import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import { requireRows } from '@/infrastructure/database/query-result';

import {
  buildBusinessReport,
  type BusinessReport,
  type BusinessReportSource,
} from './business-report-contract';
import type { BusinessReportPeriod } from './business-report-export';

export async function loadBusinessReport(
  client: TypedSupabaseClient,
  period: BusinessReportPeriod,
): Promise<BusinessReport> {
  const fromDateTime = `${period.from}T00:00:00.000Z`;
  const toDateTime = `${period.to}T23:59:59.999Z`;
  const [sales, inventory, production, events] = await Promise.all([
    client.from('business_sales_by_line').select('line_name, product_name, sku, units, revenue').gte('day', period.from).lte('day', period.to).order('revenue', { ascending: false }),
    client.from('business_inventory_by_sku').select('item_type, item_name, sku, quantity, minimum').order('quantity'),
    client.from('business_production_rates').select('planned, produced, status').gte('day', period.from).lte('day', period.to),
    client.from('analytics_events').select('user_id, session_id, event_type, page').gte('created_at', fromDateTime).lte('created_at', toDateTime),
  ]);
  const resource = 'analítica de negocio';
  const salesRows = requireRows(sales, resource);
  const inventoryRows = requireRows(inventory, resource);
  const productionRows = requireRows(production, resource);
  const eventRows = requireRows(events, resource);

  const source: BusinessReportSource = {
    sales: salesRows.map((row) => ({
      lineName: row.line_name ?? 'Sin línea',
      productName: row.product_name ?? 'Sin producto',
      sku: row.sku ?? 'SIN-SKU',
      units: Number(row.units ?? 0),
      revenue: Number(row.revenue ?? 0),
    })),
    inventory: inventoryRows.flatMap((row) => (
      row.item_type === 'product' || row.item_type === 'raw_material'
        ? [{
            itemType: row.item_type,
            name: row.item_name ?? 'Sin nombre',
            sku: row.sku ?? 'SIN-SKU',
            quantity: Number(row.quantity ?? 0),
            minimum: Number(row.minimum ?? 0),
          }]
        : []
    )),
    production: productionRows.map((row) => ({
      planned: Number(row.planned ?? 0),
      produced: Number(row.produced ?? 0),
      status: row.status ?? 'unknown',
    })),
    events: eventRows.map((row) => ({
      userId: row.user_id,
      sessionId: row.session_id,
      eventType: row.event_type,
      page: row.page,
    })),
  };
  return buildBusinessReport(source);
}
