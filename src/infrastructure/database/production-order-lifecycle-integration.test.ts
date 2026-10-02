import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'production_order_lifecycle.sql';

const FUNCTION_SECURITY =
  '../../../supabase/tests/database/' +
  'function_security.sql';

const PACKAGE_JSON =
  '../../../package.json';

function file(path: string): string {
  return readFileSync(
    new URL(path, import.meta.url),
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
  'integración del ciclo de vida de órdenes de producción',
  () => {
    it(
      'verifica el flujo transaccional completo',
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
            'public.create_production_order_draft(',
        );

        expect(databaseTest).toContain(
          'SELECT ' +
            'public.transition_production_order_lifecycle(',
        );

        expect(databaseTest).toContain(
          "'release'",
        );

        expect(databaseTest).toContain(
          "'start'",
        );

        expect(databaseTest).toContain(
          "'cancel'",
        );

        expect(databaseTest).toContain(
          'Idempotency key was reused ' +
            'with different data.',
        );

        expect(databaseTest).toContain(
          'WHEN insufficient_privilege THEN',
        );

        expect(databaseTest).toContain(
          'FROM ' +
            'public.production_order_lifecycle_operations',
        );

        expect(databaseTest).toContain(
          'FROM public.production_order_items',
        );

        expect(databaseTest).toContain(
          "production_status = 'in_progress'",
        );

        expect(databaseTest).toContain(
          "production_status = 'cancelled'",
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
          '"db:test:production-order-lifecycle": ' +
            '"bash scripts/database/' +
            'run-database-test.sh ' +
            'supabase/tests/database/' +
            'production_order_lifecycle.sql"',
        );

        expect(packageJson).toContain(
          'pnpm run db:test:raw-material-quality && ' +
            'pnpm run db:test:production-order-lifecycle && ' +
            'pnpm run db:test:production-consumption',
        );
      },
    );

    it(
      'gobierna las RPC nuevas y retira la ejecución heredada',
      () => {
        const functionSecurity =
          file(FUNCTION_SECURITY);

        const createSignature =
          'public.create_production_order_draft' +
          '(uuid,integer,text,uuid)';

        const transitionSignature =
          'public.transition_production_order_lifecycle' +
          '(uuid,text,text,uuid)';

        expect(
          functionSecurity
            .split(createSignature)
            .length - 1,
        ).toBeGreaterThanOrEqual(4);

        expect(
          functionSecurity
            .split(transitionSignature)
            .length - 1,
        ).toBeGreaterThanOrEqual(4);

        expect(
          functionSecurity
            .split(
              'public.' +
                'create_production_order_items(uuid)',
            )
            .length - 1,
        ).toBe(3);
      },
    );
  },
);
