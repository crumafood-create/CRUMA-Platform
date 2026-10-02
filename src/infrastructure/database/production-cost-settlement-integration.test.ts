import { readFileSync } from 'node:fs';

import {
  describe,
  expect,
  it,
} from 'vitest';

const DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'production_cost_settlement.sql';

const LEGACY_DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'production_costs.sql';

const FUNCTION_SECURITY =
  '../../../supabase/tests/database/' +
  'function_security.sql';

const PACKAGE_JSON =
  '../../../package.json';

const GENERATED_TYPES =
  '../../types/database/database.generated.ts';

function file(
  path: string,
): string {
  return readFileSync(
    new URL(
      path,
      import.meta.url,
    ),
    'utf8',
  );
}

function normalizeSql(
  value: string,
): string {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

describe(
  'integración del cierre de costos de producción',
  () => {
    it(
      'verifica el cierre transaccional completo',
      () => {
        const databaseTest =
          normalizeSql(
            file(DATABASE_TEST),
          );

        expect(databaseTest).toContain(
          'BEGIN;',
        );

        expect(databaseTest).toContain(
          'SELECT ' +
            'public.settle_production_cost(',
        );

        expect(databaseTest).toContain(
          'Idempotency key was reused ' +
            'with different data.',
        );

        expect(databaseTest).toContain(
          'Production cost is frozen ' +
            'after quality disposition.',
        );

        expect(databaseTest).toContain(
          'FROM ' +
            'public.production_cost_settlement_operations',
        );

        expect(databaseTest).toContain(
          'FROM public.production_cost_history',
        );

        expect(databaseTest).toContain(
          'ROLLBACK;',
        );
      },
    );

    it(
      'integra la prueba en la verificación agrupada',
      () => {
        const packageJson =
          file(PACKAGE_JSON);

        expect(packageJson).toContain(
          '"db:test:production-cost-settlement": ' +
            '"bash scripts/database/' +
            'run-database-test.sh ' +
            'supabase/tests/database/' +
            'production_cost_settlement.sql"',
        );

        expect(packageJson).toContain(
          'pnpm run db:test:costs && ' +
            'pnpm run ' +
            'db:test:production-cost-settlement && ' +
            'pnpm run db:test:quality',
        );

        expect(packageJson).toContain(
          'production-cost-authorization.test.ts ' +
            'src/modules/production/application/' +
            'production-cost-settlement-authorization.test.ts',
        );

        expect(packageJson).toContain(
          'production-cost-rls.test.ts ' +
            'src/infrastructure/database/' +
            'production-cost-settlement.test.ts ' +
            'src/infrastructure/database/' +
            'production-cost-settlement-integration.test.ts',
        );
      },
    );

    it(
      'gobierna únicamente la RPC idempotente',
      () => {
        const functionSecurity =
          file(FUNCTION_SECURITY);

        const settledSignature =
          'public.settle_production_cost' +
          '(uuid,numeric,numeric,uuid)';

        const legacySignature =
          'public.calculate_production_cost' +
          '(uuid,numeric,numeric)';

        expect(
          functionSecurity
            .split(settledSignature)
            .length - 1,
        ).toBeGreaterThanOrEqual(4);

        expect(
          functionSecurity,
        ).not.toContain(
          legacySignature,
        );
      },
    );
    it(
      'retira la ejecución heredada de costos',
      () => {
        const databaseTest =
          normalizeSql(
            file(LEGACY_DATABASE_TEST),
          );

        expect(databaseTest).toContain(
          'public.settle_production_cost(',
        );

        expect(databaseTest).not.toContain(
          'public.calculate_production_cost(',
        );

        expect(databaseTest).toContain(
          'Idempotency key was reused ' +
            'with different data.',
        );
      },
    );

    it(
      'sincroniza el cierre en los tipos Supabase',
      () => {
        const generatedTypes =
          file(GENERATED_TYPES);

        expect(generatedTypes).toContain(
          'production_cost_settlement_operations: {',
        );

        expect(generatedTypes).toContain(
          'settle_production_cost: {',
        );

        expect(generatedTypes).toContain(
          'p_idempotency_key: string',
        );

        expect(generatedTypes).toContain(
          'p_production_order_id: string',
        );
      },
    );

  },
);
