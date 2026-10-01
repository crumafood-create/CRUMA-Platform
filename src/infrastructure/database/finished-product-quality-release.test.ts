import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/' +
  '20260930010000_harden_finished_product_quality_release.sql';

  const DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'finished_product_quality_release.sql';

const PRODUCTION_LOT_DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'production_lot_release.sql';

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
  'liberación atómica de producto terminado',
  () => {
    it(
      'registra operaciones idempotentes y auditables',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'CREATE TABLE public.finished_product_quality_release_operations',
        );

        expect(migration).toContain(
          'idempotency_key uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'production_output_id uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'product_lot_id uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'inventory_movement_id uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'released_by uuid NOT NULL',
        );
      },
    );

    it(
      'bloquea la inspección y la salida',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'CREATE OR REPLACE FUNCTION ' +
            'public.release_finished_product_quality_to_inventory(',
        );

        expect(migration).toContain(
          'PERFORM pg_advisory_xact_lock(',
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
      },
    );

    it(
      'exige la inspección vigente aprobada y una salida pendiente',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          "inspection.status IS DISTINCT FROM 'passed'",
        );

        expect(migration).toContain(
          "output_row.quality_status IS DISTINCT FROM 'pending'",
        );

        expect(migration).toContain(
          'FROM public.quality_inspections newer',
        );

        expect(migration).toContain(
          '(newer.inspected_at, newer.id) > ' +
            '(inspection.inspected_at, inspection.id)',
        );

        expect(migration).toContain(
          "production_status IS DISTINCT FROM 'completed'",
        );
      },
    );

    it(
      'decide, crea el lote y registra inventario en una transacción',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'INSERT INTO public.quality_release_decisions',
        );

        expect(migration).toContain(
          "SET quality_status = 'released'",
        );

        expect(migration).toContain(
          'INSERT INTO public.product_lots',
        );

        expect(migration).toContain(
          'INSERT INTO public.production_lot_traceability',
        );

        expect(migration).toContain(
          'INSERT INTO public.inventory_movements',
        );

        expect(migration).toContain(
          'INSERT INTO ' +
            'public.finished_product_quality_release_operations',
        );

        expect(migration).toContain(
          'RETURN v_lot_id',
        );
      },
    );

    it(
      'repite la misma solicitud sin duplicar efectos',
      () => {
        const migration = normalizeSql(source());

        expect(migration).toContain(
          'existing_operation ' +
            'public.finished_product_quality_release_operations%ROWTYPE',
        );

        expect(migration).toContain(
          'WHERE idempotency_key = p_idempotency_key',
        );

        expect(migration).toContain(
          'RETURN existing_operation.product_lot_id',
        );

        expect(migration).toContain(
          'Idempotency key was reused with different data.',
        );
      },
    );

    it(
      'cierra las rutas fragmentadas anteriores',
      () => {
        const migration = normalizeSql(source());
        const productionLotDatabaseTest =
          normalizeSql(
            file(PRODUCTION_LOT_DATABASE_TEST),
          );

        expect(migration).toContain(
          "IF p_decision = 'release' THEN",
        );

        expect(migration).toContain(
          'Finished product release requires lot and inventory data.',
        );

        expect(migration).toContain(
          'REVOKE ALL ON FUNCTION ' +
            'public.release_production_output_to_inventory(',
        );

        expect(productionLotDatabaseTest).not.toContain(
          'public.release_production_output_to_inventory(',
        );

        expect(productionLotDatabaseTest).toContain(
          'public.' +
            'release_finished_product_quality_to_inventory(',
        );
      },
    );

    it(
      'protege la auditoría y la nueva RPC',
      () => {
        const migration = normalizeSql(source());

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
            'public.release_finished_product_quality_to_inventory(',
        );

        expect(migration).toContain(
          'GRANT EXECUTE ON FUNCTION ' +
            'public.release_finished_product_quality_to_inventory(',
        );
      },
    );

      it(
      'integra la prueba SQL transaccional en la verificación de base de datos',
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
            'public.release_finished_product_quality_to_inventory(',
        );

        expect(databaseTest).toContain(
          'Idempotency key was reused with different data.',
        );

        expect(databaseTest).toContain(
          'FROM ' +
            'public.finished_product_quality_release_operations',
        );

        expect(databaseTest).toContain(
          'FROM public.quality_release_decisions',
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
          '"db:test:finished-product-release": ' +
            '"bash scripts/database/run-database-test.sh ' +
            'supabase/tests/database/' +
            'finished_product_quality_release.sql"',
        );

        expect(packageJson).toContain(
          'pnpm run db:test:production-output && ' +
            'pnpm run db:test:production-yield && ' +
            'pnpm run db:test:finished-product-release && ' +
            'pnpm run db:test:lots',
        );
      },
    );

    it(
      'gobierna la RPC atómica como función segura',
      () => {
        const functionSecurity =
          file(FUNCTION_SECURITY);

        const signature =
          'public.' +
          'release_finished_product_quality_to_inventory' +
          '(uuid,text,date,uuid,uuid,uuid,text)';

        const occurrences =
          functionSecurity.split(signature).length - 1;

        expect(occurrences).toBeGreaterThanOrEqual(4);
      },
    );
  },
);