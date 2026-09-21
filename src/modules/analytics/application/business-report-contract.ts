export type BusinessReportSource = {
  sales: Array<{
    lineName: string;
    productName: string;
    sku: string;
    units: number;
    revenue: number;
  }>;
  inventory: Array<{
    itemType: 'product' | 'raw_material';
    name: string;
    sku: string;
    quantity: number;
    minimum: number;
  }>;
  production: Array<{
    planned: number;
    produced: number;
    status: string;
  }>;
  events: Array<{
    userId: string | null;
    sessionId: string | null;
    eventType: string;
    page: string | null;
  }>;
};

export type BusinessReport = {
  kpis: {
    revenue: number;
    unitsSold: number;
    trackedSkus: number;
    lowStockSkus: number;
    productionEfficiency: number;
    activeUsers: number;
  };
  salesByLine: Array<{ name: string; revenue: number; units: number }>;
  inventoryBySku: Array<BusinessReportSource['inventory'][number] & {
    status: 'out' | 'critical' | 'healthy';
    shortage: number;
  }>;
  production: {
    planned: number;
    produced: number;
    efficiency: number;
    completedOrders: number;
    totalOrders: number;
  };
  userBehavior: {
    activeUsers: number;
    sessions: number;
    events: number;
    topPages: Array<{ page: string; views: number }>;
  };
};

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const percentage = (value: number, total: number) => total > 0
  ? Math.round((value / total) * 100)
  : 0;

export function buildBusinessReport(source: BusinessReportSource): BusinessReport {
  const lines = new Map<string, { name: string; revenue: number; units: number }>();
  for (const sale of source.sales) {
    const current = lines.get(sale.lineName) ?? { name: sale.lineName, revenue: 0, units: 0 };
    current.revenue += sale.revenue;
    current.units += sale.units;
    lines.set(sale.lineName, current);
  }
  const salesByLine = [...lines.values()].sort((left, right) => right.revenue - left.revenue);

  const inventoryBySku = source.inventory.map((item) => ({
    ...item,
    status: item.quantity <= 0
      ? 'out' as const
      : item.quantity < item.minimum
        ? 'critical' as const
        : 'healthy' as const,
    shortage: Math.max(0, item.minimum - item.quantity),
  })).sort((left, right) => {
    const priority = { out: 0, critical: 1, healthy: 2 };
    return priority[left.status] - priority[right.status] || left.quantity - right.quantity;
  });

  const planned = sum(source.production.map((row) => row.planned));
  const produced = sum(source.production.map((row) => row.produced));
  const efficiency = percentage(produced, planned);
  const identities = new Set(source.events.map((event) => event.userId ?? event.sessionId).filter(Boolean));
  const sessions = new Set(source.events.map((event) => event.sessionId).filter(Boolean));
  const pages = new Map<string, number>();
  for (const event of source.events) {
    if (event.page) pages.set(event.page, (pages.get(event.page) ?? 0) + 1);
  }
  const topPages = [...pages.entries()]
    .map(([page, views]) => ({ page, views }))
    .sort((left, right) => right.views - left.views || left.page.localeCompare(right.page))
    .slice(0, 5);

  return {
    kpis: {
      revenue: sum(source.sales.map((row) => row.revenue)),
      unitsSold: sum(source.sales.map((row) => row.units)),
      trackedSkus: inventoryBySku.length,
      lowStockSkus: inventoryBySku.filter((row) => row.status !== 'healthy').length,
      productionEfficiency: efficiency,
      activeUsers: identities.size,
    },
    salesByLine,
    inventoryBySku,
    production: {
      planned,
      produced,
      efficiency,
      completedOrders: source.production.filter((row) => row.status === 'completed').length,
      totalOrders: source.production.length,
    },
    userBehavior: {
      activeUsers: identities.size,
      sessions: sessions.size,
      events: source.events.length,
      topPages,
    },
  };
}
