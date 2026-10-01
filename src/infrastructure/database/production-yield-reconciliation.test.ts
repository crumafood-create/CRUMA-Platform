import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/' +
  '20260930020000_harden_production_yield_reconciliation.sql';

const DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'production_yield_reconciliation.sql';

const PRODUCTION_OUTPUT_DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'production_output_quarantine.sql';

const FUNCTION_SECURITY =
  '../../../supabase/tests/database/' +
  'function_security.sql';

const PACKAGE_JSON = '../../../package.json';

function file(path: string): string {
  return readFileSync(
    new URL(path, import.meta.url),
    'utf8',
  );
}

function source(): string {
  return file(MIGRATION);
}

function normalizeSql(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

describe(
  'conciliación del rendimiento de producción',
  () => {
    it(
      'amplía la auditoría del cierre con plan, merma y motivo',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'ALTER TABLE public.production_output_completion_operations',
        );

        expect(migration).toContain(
          'ADD COLUMN planned_quantity integer',
        );

        expect(migration).toContain(
          'ADD COLUMN waste_quantity integer',
        );

        expect(migration).toContain(
          'ADD COLUMN variance_reason text',
        );

        expect(migration).toContain(
          'UPDATE public.production_output_completion_operations AS operation',
        );

        expect(migration).toContain(
          'ALTER COLUMN planned_quantity SET NOT NULL',
        );

        expect(migration).toContain(
          'ALTER COLUMN waste_quantity SET NOT NULL',
        );

        expect(migration).toContain(
          'CHECK (waste_quantity >= 0)',
        );
      },
    );

    it(
      'declara una RPC de cierre conciliado',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'CREATE OR REPLACE FUNCTION ' +
            'public.complete_production_yield_to_quarantine(',
        );

        expect(migration).toContain(
          'p_produced_quantity integer',
        );

        expect(migration).toContain(
          'p_waste_quantity integer',
        );

        expect(migration).toContain(
          'p_variance_reason text',
        );

        expect(migration).toContain(
          'p_idempotency_key uuid',
        );
      },
    );

    it(
      'bloquea la orden y exige materiales completos',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'FROM public.production_orders',
        );

        expect(migration).toContain(
          'FOR UPDATE',
        );

        expect(migration).toContain(
          "production_status IS DISTINCT FROM 'in_progress'",
        );

        expect(migration).toContain(
          'All production materials must be consumed.',
        );
      },
    );

    it(
      'concilia producción, merma y sobreproducción',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'p_produced_quantity + p_waste_quantity',
        );

        expect(migration).toContain(
          'order_row.planned_quantity',
        );

        expect(migration).toContain(
          'Production yield does not reconcile with planned quantity.',
        );

        expect(migration).toContain(
          'Overproduction cannot include waste.',
        );

        expect(migration).toContain(
          'Production variance reason is required.',
        );
      },
    );

    it(
      'mantiene la salida conforme en cuarentena',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'INSERT INTO public.production_outputs',
        );

        expect(migration).toContain(
          "'pending'",
        );

        expect(migration).toContain(
          'UPDATE public.production_orders',
        );

        expect(migration).toContain(
          'INSERT INTO ' +
            'public.production_output_completion_operations',
        );

        expect(migration).not.toContain(
          'INSERT INTO public.waste_tracking',
        );
      },
    );

    it(
      'hace idempotente toda la conciliación',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'pg_advisory_xact_lock',
        );

        expect(migration).toContain(
          'existing_operation.waste_quantity',
        );

        expect(migration).toContain(
          'existing_operation.variance_reason',
        );

        expect(migration).toContain(
          'Idempotency key was reused with different data.',
        );

        expect(migration).toContain(
          'RETURN existing_operation.production_output_id',
        );
      },
    );

    it(
      'retira el cierre sin conciliación y protege la nueva RPC',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'SECURITY DEFINER SET search_path =',
        );

        expect(migration).toContain(
          'REVOKE ALL ON FUNCTION ' +
            'public.complete_production_output_quarantine(',
        );

        expect(migration).toContain(
          'REVOKE ALL ON FUNCTION ' +
            'public.complete_production_yield_to_quarantine(',
        );

        expect(migration).toContain(
          'GRANT EXECUTE ON FUNCTION ' +
            'public.complete_production_yield_to_quarantine(',
        );
      },
    );
    it(
      'integra la prueba SQL transaccional en base de datos',
      () => {
        const databaseTest = normalizeSql(
          file(DATABASE_TEST),
        );

        const productionOutputDatabaseTest =
          normalizeSql(
            file(PRODUCTION_OUTPUT_DATABASE_TEST),
          );

        const packageJson = file(PACKAGE_JSON);

        expect(databaseTest).toContain(
          'BEGIN;',
        );

        expect(databaseTest).toContain(
          'SELECT ' +
            'public.complete_production_yield_to_quarantine(',
        );

        expect(databaseTest).toContain(
          'Production yield does not reconcile with planned quantity.',
        );

        expect(databaseTest).toContain(
          'Overproduction cannot include waste.',
        );

        expect(databaseTest).toContain(
          'Idempotency key was reused with different data.',
        );

        expect(databaseTest).toContain(
          'FROM ' +
            'public.production_output_completion_operations',
        );

        expect(databaseTest).toContain(
          'ROLLBACK;',
        );

        expect(
          productionOutputDatabaseTest,
        ).not.toContain(
          'public.complete_production_output_quarantine(',
        );

        expect(
          productionOutputDatabaseTest,
        ).toContain(
          'public.complete_production_yield_to_quarantine(',
        );

        expect(packageJson).toContain(
          '"db:test:production-yield": ' +
            '"bash scripts/database/run-database-test.sh ' +
            'supabase/tests/database/' +
            'production_yield_reconciliation.sql"',
        );

        expect(packageJson).toContain(
          'pnpm run db:test:production-output && ' +
            'pnpm run db:test:production-yield && ' +
            'pnpm run db:test:finished-product-release',
        );
      },
    );

    it(
      'gobierna únicamente la RPC conciliada como función segura',
      () => {
        const functionSecurity =
          file(FUNCTION_SECURITY);

        const reconciledSignature =
          'public.' +
          'complete_production_yield_to_quarantine' +
          '(uuid,integer,integer,text,uuid)';

        const legacySignature =
          'public.' +
          'complete_production_output_quarantine' +
          '(uuid,integer,uuid)';

        expect(
          functionSecurity
            .split(reconciledSignature)
            .length - 1,
        ).toBeGreaterThanOrEqual(4);

        expect(
          functionSecurity
            .split(legacySignature)
            .length - 1,
        ).toBe(0);
      },
    );
    it(
      'sincroniza la auditoría y las RPC en los tipos Supabase',
      () => {
        const databaseTypes = file(
          '../../types/database/database.generated.ts',
        );

        const tableStart = databaseTypes.indexOf(
          '      production_output_completion_operations: {',
        );

        const tableEnd = databaseTypes.indexOf(
          '      production_outputs: {',
          tableStart,
        );

        expect(tableStart).toBeGreaterThanOrEqual(0);
        expect(tableEnd).toBeGreaterThan(tableStart);

        const operationTable = databaseTypes.slice(
          tableStart,
          tableEnd,
        );

        expect(
          operationTable.match(
            /planned_quantity(?:\?)?: number/g,
          ) ?? [],
        ).toHaveLength(3);

        expect(
          operationTable.match(
            /waste_quantity(?:\?)?: number/g,
          ) ?? [],
        ).toHaveLength(3);

        expect(
          operationTable.match(
            /variance_reason(?:\?)?: string \| null/g,
          ) ?? [],
        ).toHaveLength(3);

        const reconciledRpcStart =
          databaseTypes.indexOf(
            '      complete_production_yield_to_quarantine: {',
          );

        const reconciledRpcEnd =
          databaseTypes.indexOf(
            '      confirm_picking_item: {',
            reconciledRpcStart,
          );

        expect(
          reconciledRpcStart,
        ).toBeGreaterThanOrEqual(0);

        expect(
          reconciledRpcEnd,
        ).toBeGreaterThan(reconciledRpcStart);

        const reconciledRpc =
          databaseTypes.slice(
            reconciledRpcStart,
            reconciledRpcEnd,
          );

        expect(reconciledRpc).toContain(
          'p_idempotency_key: string',
        );

        expect(reconciledRpc).toContain(
          'p_produced_quantity: number',
        );

        expect(reconciledRpc).toContain(
          'p_production_order_id: string',
        );

        expect(reconciledRpc).toContain(
          'p_variance_reason: string',
        );

        expect(reconciledRpc).toContain(
          'p_waste_quantity: number',
        );

        expect(reconciledRpc).toContain(
          'Returns: string',
        );

        /*
         * La función heredada permanece en el esquema,
         * pero la migración revoca todos sus permisos.
         */
        expect(databaseTypes).toContain(
          '      complete_production_output_quarantine: {',
        );
      },
    );

  },
);
