import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('lecturas de los flujos P1', () => {
  it.each([
    ['../../../app/(admin)/dashboard/page.tsx', 'indicadores del dashboard'],
    ['../../../app/(admin)/sales-orders/page.tsx', 'órdenes de venta'],
    ['../../../app/(admin)/inventory-stock/page.tsx', 'stock'],
    ['../../../app/(admin)/production-orders/page.tsx', 'órdenes de producción'],
    ['../../../app/(admin)/accounts-receivable/page.tsx', 'cuentas por cobrar'],
    ['../../../app/(admin)/demand-forecasts/page.tsx', 'pronósticos de demanda'],
  ])('%s falla explícitamente si Supabase devuelve error', (path, resource) => {
    const page = source(path);

    expect(page).toContain('requireRows(');
    expect(page).toContain(`'${resource}'`);
  });
});
