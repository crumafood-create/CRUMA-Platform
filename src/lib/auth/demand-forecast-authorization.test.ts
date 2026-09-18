import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const ACTIONS = '../../app/(admin)/demand-forecasts/actions.ts';

function source(): string {
  return readFileSync(new URL(ACTIONS, import.meta.url), 'utf8');
}

function actionSource(action: string): string {
  const file = source();
  const start = file.indexOf(`export async function ${action}`);
  const next = file.indexOf('export async function ', start + 1);

  if (start < 0) throw new Error(`Acción no encontrada: ${action}`);

  return file.slice(start, next < 0 ? undefined : next);
}

describe('autorización de forecast', () => {
  it.each([
    ['calculateDemandForecasts', 'DEMAND_FORECAST_MANAGE'],
    ['createProductionOrderFromForecast', 'PRODUCTION_ORDER_CREATE'],
    ['createForecastApprovals', 'DEMAND_FORECAST_MANAGE'],
  ])('protege %s con %s', (action, permission) => {
    const body = actionSource(action);

    expect(body).toContain('requireTypedAuthorizedAction(');
    expect(body).toContain(`PERMISSIONS.${permission}`);
  });

  it('crea una orden identificable y genera sus partidas de receta', () => {
    const body = actionSource('createProductionOrderFromForecast');

    expect(body).toContain('production_number: generateProductionNumber()');
    expect(body).toContain(".rpc('create_production_order_items'");
  });
});
