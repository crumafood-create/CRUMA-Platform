import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/' +
  '20261001010000_harden_finished_product_nonconformance_disposition.sql';

const DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'finished_product_nonconformance_disposition.sql';

const FUNCTION_SECURITY =
  '../../../supabase/tests/database/' +
  'function_security.sql';

const PACKAGE_JSON = '../../../package.json';

const GENERATED_TYPES =
  '../../types/database/database.generated.ts';

const REPOSITORY =
  '../../modules/production/application/' +
  'finished-product-nonconformance-disposition-repository.ts';

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
  'disposición atómica de producto terminado no conforme',
  () => {
    it(
      'registra operaciones idempotentes y auditables',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'CREATE TABLE ' +
            'public.finished_product_nonconformance_disposition_operations',
        );

        expect(migration).toContain(
          'idempotency_key uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'quality_inspection_id uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'production_output_id uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'rework_production_order_id uuid UNIQUE',
        );

        expect(migration).toContain(
          "CHECK (disposition IN ('scrap', 'rework'))",
        );

        expect(migration).toContain(
          "CHECK (btrim(reason) <> '')",
        );

        expect(migration).toContain(
          'disposed_by uuid NOT NULL',
        );
      },
    );

    it(
      'declara una única RPC de disposición',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'CREATE OR REPLACE FUNCTION ' +
            'public.dispose_finished_product_nonconformance(',
        );

        expect(migration).toContain(
          'p_inspection_id uuid',
        );

        expect(migration).toContain(
          'p_disposition text',
        );

        expect(migration).toContain(
          'p_reason text',
        );

        expect(migration).toContain(
          'p_idempotency_key uuid',
        );

        expect(migration).toContain(
          'RETURNS uuid',
        );
      },
    );

    it(
      'bloquea la inspección y la salida',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'pg_advisory_xact_lock',
        );

        expect(migration).toContain(
          'FROM public.quality_inspections',
        );

        expect(migration).toContain(
          'FROM public.production_outputs',
        );

        expect(migration).toContain(
          'FOR UPDATE',
        );

        expect(migration).toContain(
          'A newer quality inspection exists.',
        );
      },
    );

    it(
      'exige una salida no conforme sin decisión previa',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          "inspection.status NOT IN ('hold', 'failed')",
        );

        expect(migration).toContain(
          "inspection.result NOT IN ('rework', 'reject')",
        );

        expect(migration).toContain(
          "output_row.quality_status NOT IN ('hold', 'rejected')",
        );

        expect(migration).toContain(
          'FROM public.quality_release_decisions',
        );

        expect(migration).toContain(
          'Quality inspection already has a decision.',
        );

        expect(migration).toContain(
          'FROM ' +
            'public.finished_product_quality_release_operations',
        );
      },
    );

    it(
      'registra el rechazo y cierra la salida',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'INSERT INTO public.quality_release_decisions',
        );

        expect(migration).toContain(
          "'production_output', 'reject'",
        );

        expect(migration).toContain(
          'UPDATE public.production_outputs',
        );

        expect(migration).toContain(
          "SET quality_status = 'rejected'",
        );
      },
    );

    it(
      'crea una orden borrador cuando hay retrabajo',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          "IF p_disposition = 'rework' THEN",
        );

        expect(migration).toContain(
          'INSERT INTO public.production_orders',
        );

        expect(migration).toContain(
          "'draft'",
        );

        expect(migration).toContain(
          'INSERT INTO public.production_order_items',
        );

        expect(migration).toContain(
          'FROM public.recipe_items',
        );

        expect(migration).toContain(
          'rework_production_order_id',
        );
      },
    );

    it(
      'mantiene scrap y retrabajo fuera del inventario',
      () => {
        const migration = normalizeSql(source());

        expect(migration).not.toContain(
          'INSERT INTO public.product_lots',
        );

        expect(migration).not.toContain(
          'INSERT INTO public.inventory_movements',
        );

        expect(migration).toContain(
          "disposition = 'scrap'",
        );

        expect(migration).toContain(
          'rework_production_order_id IS NULL',
        );

        expect(migration).toContain(
          "disposition = 'rework'",
        );

        expect(migration).toContain(
          'rework_production_order_id IS NOT NULL',
        );
      },
    );

    it(
      'cierra el rechazo fragmentado y protege la RPC',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          "IF p_decision = 'reject' THEN",
        );

        expect(migration).toContain(
          'Finished product rejection requires ' +
            'an atomic disposition.',
        );

        expect(migration).toContain(
          'Idempotency key was reused with different data.',
        );

        expect(migration).toContain(
          'SECURITY DEFINER SET search_path =',
        );

        expect(migration).toContain(
          'ENABLE ROW LEVEL SECURITY',
        );

        expect(migration).toContain(
          'USING (public.is_admin(auth.uid()))',
        );

        expect(migration).toContain(
          'REVOKE ALL ON FUNCTION ' +
            'public.dispose_finished_product_nonconformance(',
        );

        expect(migration).toContain(
          'GRANT EXECUTE ON FUNCTION ' +
            'public.dispose_finished_product_nonconformance(',
        );
      },
    );
    it(
      'integra la prueba SQL transaccional en base de datos',
      () => {
        const databaseTest = normalizeSql(
          file(DATABASE_TEST),
        );

        const packageJson = file(PACKAGE_JSON);

        expect(databaseTest).toContain(
          'BEGIN;',
        );

        expect(databaseTest).toContain(
          'SELECT ' +
            'public.dispose_finished_product_nonconformance(',
        );

        expect(databaseTest).toContain(
          'Idempotency key was reused with different data.',
        );

        expect(databaseTest).toContain(
          'FROM ' +
            'public.finished_product_nonconformance_disposition_operations',
        );

        expect(databaseTest).toContain(
          'FROM public.quality_release_decisions',
        );

        expect(databaseTest).toContain(
          'FROM public.production_orders',
        );

        expect(databaseTest).toContain(
          'FROM public.production_order_items',
        );

        expect(databaseTest).toContain(
          'FROM public.product_lots',
        );

        expect(databaseTest).toContain(
          'FROM public.inventory_movements',
        );

        expect(databaseTest).toContain(
          'ROLLBACK;',
        );

        expect(packageJson).toContain(
          '"db:test:finished-product-disposition": ' +
            '"bash scripts/database/run-database-test.sh ' +
            'supabase/tests/database/' +
            'finished_product_nonconformance_disposition.sql"',
        );

        expect(packageJson).toContain(
          'pnpm run db:test:finished-product-release && ' +
            'pnpm run db:test:finished-product-disposition && ' +
            'pnpm run db:test:lots',
        );
      },
    );

    it(
      'gobierna la RPC de disposición como función segura',
      () => {
        const functionSecurity =
          file(FUNCTION_SECURITY);

        const signature =
          'public.' +
          'dispose_finished_product_nonconformance' +
          '(uuid,text,text,uuid)';

        const occurrences =
          functionSecurity.split(signature).length - 1;

        expect(occurrences).toBeGreaterThanOrEqual(4);
      },
    );

    it(
      'sincroniza auditoría y RPC en los tipos Supabase',
      () => {
        const generatedTypes =
          file(GENERATED_TYPES);

        const repository = file(REPOSITORY);

        expect(generatedTypes).toContain(
          'finished_product_nonconformance_disposition_operations: {',
        );

        expect(generatedTypes).toContain(
          'disposed_quantity: number',
        );

        expect(generatedTypes).toContain(
          'disposition: string',
        );

        expect(generatedTypes).toContain(
          'quality_inspection_id: string',
        );

        expect(generatedTypes).toContain(
          'quality_release_decision_id: string',
        );

        expect(generatedTypes).toContain(
          'production_output_id: string',
        );

        expect(generatedTypes).toContain(
          'rework_production_order_id: string | null',
        );

        expect(generatedTypes).toContain(
          'dispose_finished_product_nonconformance: {',
        );

        expect(generatedTypes).toContain(
          'p_disposition: string',
        );

        expect(generatedTypes).toContain(
          'p_idempotency_key: string',
        );

        expect(generatedTypes).toContain(
          'p_inspection_id: string',
        );

        expect(generatedTypes).toContain(
          'p_reason: string',
        );

        expect(repository).toContain(
          'await supabase.rpc(',
        );

        expect(repository).not.toContain(
          'FinishedProductNonconformanceDispositionRpc',
        );

        expect(repository).not.toContain(
          'as unknown as',
        );
      },
    );

  },
);
