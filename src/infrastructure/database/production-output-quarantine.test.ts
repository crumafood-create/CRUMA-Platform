import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/' +
  '20260929010000_harden_production_output_quarantine.sql';

  const DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'production_output_quarantine.sql';

const PACKAGE_JSON = '../../../package.json';

const FUNCTION_SECURITY =
  '../../../supabase/tests/database/' +
  'function_security.sql';

const FUNCTION_SIGNATURE =
  'public.complete_production_yield_to_quarantine' +
  '(uuid,integer,integer,text,uuid)';

function source(path: string = MIGRATION): string {
  return readFileSync(
    new URL(path, import.meta.url),
    'utf8',
  );
}

function normalizeSql(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

describe(
  'salida de producción en cuarentena',
  () => {
    it(
      'registra cierres idempotentes y auditables',
      () => {
        const migration = normalizeSql(
          source(),
        );

        expect(migration).toContain(
          'CREATE TABLE public.production_output_completion_operations',
        );

        expect(migration).toContain(
          'idempotency_key uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'production_output_id uuid NOT NULL',
        );

        expect(migration).toContain(
          'completed_by uuid NOT NULL',
        );
      },
    );

    it(
      'bloquea y valida la orden antes de completarla',
      () => {
        const migration = normalizeSql(
          source(),
        );

        expect(migration).toContain(
          'CREATE OR REPLACE FUNCTION ' +
            'public.complete_production_output_quarantine(',
        );

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
          'FROM public.production_order_items',
        );

        expect(migration).toContain(
          "status IS DISTINCT FROM 'completed'",
        );
      },
    );

    it(
      'crea una salida pendiente y completa la orden atómicamente',
      () => {
        const migration = normalizeSql(
          source(),
        );

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
          'produced_quantity = p_produced_quantity',
        );

        expect(migration).toContain(
          "production_status = 'completed'",
        );

        expect(migration).toContain(
          'RETURN v_output_id',
        );
      },
    );

    it(
      'repite la operación sin duplicar la salida',
      () => {
        const migration = normalizeSql(
          source(),
        );

        expect(migration).toContain(
          'existing_operation ' +
            'public.production_output_completion_operations%ROWTYPE',
        );

        expect(migration).toContain(
          'WHERE idempotency_key = p_idempotency_key',
        );

        expect(migration).toContain(
          'RETURN existing_operation.production_output_id',
        );

        expect(migration).toContain(
          'INSERT INTO ' +
            'public.production_output_completion_operations',
        );
      },
    );

    it(
      'mantiene la salida fuera del inventario hasta calidad',
      () => {
        const migration = normalizeSql(
          source(),
        );

        expect(migration).not.toContain(
          'INSERT INTO public.product_lots',
        );

        expect(migration).not.toContain(
          'INSERT INTO public.inventory_movements',
        );
      },
    );

    it(
      'protege la tabla y la RPC de cierre',
      () => {
        const migration = normalizeSql(
          source(),
        );

        expect(migration).toContain(
          'ENABLE ROW LEVEL SECURITY',
        );

        expect(migration).toContain(
          'USING (public.is_admin(auth.uid()))',
        );

        expect(migration).toContain(
          'SECURITY DEFINER SET search_path =',
        );

        expect(migration).toContain(
          'REVOKE ALL ON FUNCTION ' +
            'public.complete_production_output_quarantine(',
        );

        expect(migration).toContain(
          'GRANT EXECUTE ON FUNCTION ' +
            'public.complete_production_output_quarantine(',
        );
      },
    );

    it(
  'integra la prueba SQL transaccional en la verificación de base de datos',
  () => {
    const databaseTest = normalizeSql(
      source(DATABASE_TEST),
    );

    const packageJson = source(PACKAGE_JSON);

    expect(databaseTest).toContain('BEGIN;');

    expect(databaseTest).toContain(
      'SELECT public.complete_production_yield_to_quarantine(',
    );

    expect(databaseTest).toContain(
      "quality_status = 'pending'",
    );

    expect(databaseTest).toContain(
      'FROM public.product_lots',
    );

    expect(databaseTest).toContain(
      'FROM public.inventory_movements',
    );

    expect(databaseTest).toContain('ROLLBACK;');

    expect(packageJson).toContain(
      '"db:test:production-output": ' +
        '"bash scripts/database/run-database-test.sh ' +
        'supabase/tests/database/' +
        'production_output_quarantine.sql"',
    );

    expect(packageJson).toContain(
      'pnpm run db:test:production-consumption && ' +
        'pnpm run db:test:production-output && ' +
        'pnpm run db:test:production-yield && ' +
        'pnpm run db:test:finished-product-release && ' +
        'pnpm run db:test:finished-product-disposition && ' +
        'pnpm run db:test:lots',
    );
  },
);

it(
  'gobierna la RPC de cierre como función segura',
  () => {
    const functionSecurity = source(
      FUNCTION_SECURITY,
    );

    const occurrences =
      functionSecurity
        .split(FUNCTION_SIGNATURE)
        .length - 1;

    expect(occurrences).toBeGreaterThanOrEqual(4);
  },
);
  },
);