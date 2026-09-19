export type NumericValue = number | string | null;

export type DashboardSource = {
  sales: Array<{ total: NumericValue }>;
  receivables: Array<{ balance: NumericValue }>;
  stock: Array<{ item_type: string | null; quantity: NumericValue }>;
  production: Array<{ production_status: string | null }>;
  forecasts: Array<{ suggested_production: NumericValue }>;
};

export type DashboardSummary = {
  salesMonth: number;
  receivableBalance: number;
  productCount: number;
  materialCount: number;
  criticalCount: number;
  openProduction: number;
  completedProduction: number;
  productsToProduce: number;
  suggestedProduction: number;
};

const numberValue = (value: NumericValue): number => Number(value ?? 0);

export function buildDashboardSummary(
  source: DashboardSource,
): DashboardSummary {
  return {
    salesMonth: source.sales.reduce(
      (sum, row) => sum + numberValue(row.total),
      0,
    ),
    receivableBalance: source.receivables.reduce(
      (sum, row) => sum + numberValue(row.balance),
      0,
    ),
    productCount: source.stock.filter(
      (row) => row.item_type === 'product' && numberValue(row.quantity) > 0,
    ).length,
    materialCount: source.stock.filter(
      (row) =>
        row.item_type === 'raw_material' && numberValue(row.quantity) > 0,
    ).length,
    criticalCount: source.stock.filter(
      (row) => numberValue(row.quantity) <= 0,
    ).length,
    openProduction: source.production.filter(
      (row) =>
        row.production_status !== 'completed' &&
        row.production_status !== 'cancelled',
    ).length,
    completedProduction: source.production.filter(
      (row) => row.production_status === 'completed',
    ).length,
    productsToProduce: source.forecasts.filter(
      (row) => numberValue(row.suggested_production) > 0,
    ).length,
    suggestedProduction: source.forecasts.reduce(
      (sum, row) => sum + numberValue(row.suggested_production),
      0,
    ),
  };
}
