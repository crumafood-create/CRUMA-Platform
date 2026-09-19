export type DashboardPeriod = '7d' | '30d' | '90d' | 'custom';

export type DashboardFilterInput = {
  period?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  user?: string | undefined;
  warehouse?: string | undefined;
};

export type DashboardFilters = {
  from: string;
  to: string;
  period: DashboardPeriod;
  userId: string | null;
  warehouseId: string | null;
};

const SAFE_ID = /^[a-zA-Z0-9_-]{1,80}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function safeId(value: string | undefined): string | null {
  return value && SAFE_ID.test(value) ? value : null;
}

function validDate(value: string | undefined): value is string {
  if (!value || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function dayBoundary(value: Date, end = false): string {
  const date = new Date(value);
  date.setUTCHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  return date.toISOString();
}

export function parseDashboardFilters(
  input: DashboardFilterInput,
  now = new Date(),
): DashboardFilters {
  const period = input.period === '7d' || input.period === '90d'
    ? input.period
    : input.period === 'custom' && validDate(input.from) && validDate(input.to)
      ? 'custom'
      : '30d';

  let from: string;
  let to: string;

  if (period === 'custom') {
    const customFrom = new Date(`${input.from}T00:00:00.000Z`);
    const customTo = new Date(`${input.to}T23:59:59.999Z`);
    if (customFrom <= customTo) {
      from = customFrom.toISOString();
      to = customTo.toISOString();
    } else {
      return parseDashboardFilters({ ...input, period: '30d' }, now);
    }
  } else {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    from = dayBoundary(start);
    to = dayBoundary(now, true);
  }

  return {
    from,
    to,
    period,
    userId: safeId(input.user),
    warehouseId: safeId(input.warehouse),
  };
}
