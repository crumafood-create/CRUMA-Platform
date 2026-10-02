import { readFileSync } from 'node:fs';

import {
  describe,
  expect,
  it,
} from 'vitest';

const ACTION =
  'src/app/(admin)/production-costs/actions.ts';

const FORM =
  'src/modules/manufacturing/components/forms/' +
  'production-cost-form.tsx';

const ORDER_PAGE =
  'src/app/(admin)/production-orders/' +
  '[id]/page.tsx';

const COST_PAGE =
  'src/app/(admin)/production-costs/' +
  '[id]/page.tsx';

const REPOSITORY =
  'src/modules/production/application/' +
  'production-cost-repository.ts';

function source(
  path: string,
): string {
  return readFileSync(
    path,
    'utf8',
  );
}

describe(
  'autorización del cierre de costos de producción',
  () => {
    it(
      'autoriza antes de delegar el cierre',
      () => {
        const action = source(ACTION);

        const authorization =
          action.indexOf(
            'requireTypedAuthorizedAction(',
          );

        const persistence =
          action.indexOf(
            'persistProductionCost(',
          );

        expect(authorization).toBeGreaterThanOrEqual(0);
        expect(persistence).toBeGreaterThan(
          authorization,
        );

        expect(action).toContain(
          'PERMISSIONS.PRODUCTION_COST_CALCULATE',
        );

        expect(action).not.toContain(
          ".from('production_costs')",
        );
      },
    );

    it(
      'captura una clave idempotente en el formulario',
      () => {
        const form = source(FORM);

        expect(form).toContain(
          'idempotencyKey: string;',
        );

        expect(form).toContain(
          'name="idempotency_key"',
        );

        expect(form).toContain(
          'value={idempotencyKey}',
        );
      },
    );

    it(
      'genera una clave nueva desde cada página de servidor',
      () => {
        const orderPage =
          source(ORDER_PAGE);

        const costPage =
          source(COST_PAGE);

        expect(orderPage).toContain(
          'costSettlementIdempotencyKey =',
        );

        expect(orderPage).toContain(
          'idempotencyKey={' +
            'costSettlementIdempotencyKey}',
        );

        expect(costPage).toContain(
          "import crypto from 'node:crypto';",
        );

        expect(costPage).toContain(
          'costSettlementIdempotencyKey =',
        );

        expect(costPage).toContain(
          'idempotencyKey={' +
            'costSettlementIdempotencyKey}',
        );
      },
    );

    it(
      'delega únicamente a la RPC conciliada',
      () => {
        const repository =
          source(REPOSITORY);

        expect(repository).toContain(
          "'settle_production_cost'",
        );

        expect(repository).toContain(
          'p_idempotency_key:',
        );

        expect(repository).not.toContain(
          "'calculate_production_cost'",
        );

        expect(repository).not.toContain(
          'as unknown as',
        );
      },
    );
  },
);
