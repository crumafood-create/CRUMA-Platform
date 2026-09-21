import type { BusinessReportPeriod } from './business-report-export';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string | undefined): value is string {
  if (!value || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseBusinessReportPeriod(
  input: { from?: string | undefined; to?: string | undefined },
  now = new Date(),
): BusinessReportPeriod {
  if (validDate(input.from) && validDate(input.to) && input.from <= input.to) {
    return { from: input.from, to: input.to };
  }
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    from: start.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}
