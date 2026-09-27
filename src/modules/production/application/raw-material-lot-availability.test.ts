import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const PRODUCTION_ORDER_ACTIONS =
  '../../../app/(admin)/production-orders/actions.ts';

const PRODUCTION_LOTS = './production-lot.ts';

const PRODUCTION_MOVEMENTS =
  './production-movements.ts';

function source(path: string): string {
  return readFileSync(
    new URL(path, import.meta.url),
    'utf8',
  );
}

function occurrences(
  value: string,
  fragment: string,
): number {
  return value.split(fragment).length - 1;
}

  it('impide consumir un lote que no esté disponible', () => {
    const movements = source(
      PRODUCTION_MOVEMENTS,
    );

    expect(movements).toContain(
      ".eq('status', 'available')",
    );

    expect(movements).toContain(
      ".select('id')",
    );

    expect(movements).toContain(
      '.maybeSingle()',
    );

    expect(movements).toContain(
      'if (!data)',
    );
  });

describe('disponibilidad de lotes de materia prima', () => {
  it('excluye cuarentena de la validación de stock', () => {
    const actions = source(
      PRODUCTION_ORDER_ACTIONS,
    );

    expect(actions).toContain(
      ".eq('status', 'available')",
    );
  });

  it('excluye cuarentena de consultas FEFO', () => {
    const lots = source(PRODUCTION_LOTS);

    expect(
      occurrences(
        lots,
        ".eq('status', 'available')",
      ),
    ).toBeGreaterThanOrEqual(2);
  });
});