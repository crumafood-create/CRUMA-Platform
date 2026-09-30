import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/' +
  '20260928010000_harden_raw_material_quality_release.sql';

const DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'raw_material_quality_release.sql';

const PACKAGE_JSON = '../../../package.json';

const FUNCTION_SECURITY =
  '../../../supabase/tests/database/' +
  'function_security.sql';

function source(path: string): string {
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

describe('liberación de calidad de materia prima', () => {
  it('extiende el modelo canónico de inspecciones', () => {
    const migration = normalizeSql(
      source(MIGRATION),
    );

    expect(migration).toContain(
      'ALTER TABLE public.quality_inspections',
    );

    expect(migration).toContain(
      'ADD COLUMN raw_material_lot_id uuid',
    );

    expect(migration).toContain(
      'ADD COLUMN purchase_receipt_item_id uuid',
    );

    expect(migration).toContain(
      'ALTER COLUMN production_output_id DROP NOT NULL',
    );

    expect(migration).toContain(
      'ALTER COLUMN sampled_quantity TYPE numeric(18,4)',
    );

    expect(migration).toContain(
      'ADD CONSTRAINT quality_inspections_subject_check',
    );

        expect(migration).toContain(
      'ALTER TABLE public.quality_defects ' +
        'ALTER COLUMN quantity TYPE numeric(18,4)',
    );
  });

  it('permite al administrador consultar lotes para inspeccionarlos', () => {
    const migration = normalizeSql(
      source(MIGRATION),
    );

    expect(migration).toContain(
      'CREATE POLICY raw_material_lots_admin_read ' +
        'ON public.raw_material_lots ' +
        'FOR SELECT TO authenticated ' +
        'USING (public.is_admin(auth.uid()))',
    );
  });

  it('gobierna todas las RPC de calidad como funciones seguras', () => {
    const functionSecurity = source(
      FUNCTION_SECURITY,
    );

    for (const signature of [
      'public.record_quality_inspection(uuid,integer,text,jsonb,jsonb)',
      'public.decide_quality_release(uuid,text,text)',
      'public.record_raw_material_quality_inspection(uuid,numeric,text,jsonb,jsonb)',
      'public.decide_raw_material_quality_release(uuid,text,text)',
    ]) {
      const occurrences =
        functionSecurity.split(signature).length - 1;

      expect(
        occurrences,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it('integra la prueba SQL transaccional en la verificación de base de datos', () => {
    const databaseTest = normalizeSql(
      source(DATABASE_TEST),
    );

    const packageJson = source(PACKAGE_JSON);

    expect(databaseTest).toContain('BEGIN;');

    expect(databaseTest).toContain(
      'SELECT public.receive_purchase_order_lot(',
    );

    expect(databaseTest).toContain(
      'SELECT public.record_raw_material_quality_inspection(',
    );

    expect(databaseTest).toContain(
      'SELECT public.decide_raw_material_quality_release(',
    );

    expect(databaseTest).toContain(
      'AND previous_stock = 10.2500',
    );

    expect(databaseTest).toContain(
      'AND new_stock = 14.7500',
    );

    expect(databaseTest).toContain('ROLLBACK;');

    expect(packageJson).toContain(
      '"db:test:raw-material-quality": ' +
        '"bash scripts/database/run-database-test.sh ' +
        'supabase/tests/database/' +
        'raw_material_quality_release.sql"',
    );

    expect(packageJson).toContain(
  'pnpm run db:test:quality && ' +
    'pnpm run db:test:raw-material-quality && ' +
    'pnpm run db:test:production-consumption && ' +
    'pnpm run db:test:production-output && ' +
    'pnpm run db:test:lots',
);
  });

  it('registra inspecciones de lotes en cuarentena', () => {
    const migration = normalizeSql(
      source(MIGRATION),
    );

    expect(migration).toContain(
      'CREATE OR REPLACE FUNCTION ' +
        'public.record_raw_material_quality_inspection(',
    );

    expect(migration).toContain(
      'FROM public.raw_material_lots',
    );

    expect(migration).toContain(
      'INSERT INTO public.quality_inspections',
    );

    expect(migration).toContain(
      'INSERT INTO public.quality_inspection_items',
    );

    expect(migration).toContain(
      'INSERT INTO public.quality_defects',
    );
  });

  it('libera el lote y crea inventario disponible una sola vez', () => {
    const migration = normalizeSql(
      source(MIGRATION),
    );

    expect(migration).toContain(
      'CREATE OR REPLACE FUNCTION ' +
        'public.decide_raw_material_quality_release(',
    );

    expect(migration).toContain(
      'UPDATE public.raw_materials',
    );

    expect(migration).toContain(
      'current_stock = current_stock + lot.quantity',
    );

    expect(migration).toContain(
      'INSERT INTO public.inventory_movements',
    );

    expect(migration).toContain(
      "UPDATE public.raw_material_lots SET status = 'available'",
    );
    expect(migration).toContain(
  'ALTER TABLE public.inventory_movements ALTER COLUMN previous_stock TYPE numeric(18,4)',
);

expect(migration).toContain(
  'ALTER COLUMN new_stock TYPE numeric(18,4)',
);
  });

  it('protege las operaciones de inspección y disposición', () => {
    const migration = normalizeSql(
      source(MIGRATION),
    );

    expect(migration).toContain(
      'SECURITY DEFINER SET search_path =',
    );

    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION ' +
        'public.record_raw_material_quality_inspection(',
    );

    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION ' +
        'public.decide_raw_material_quality_release(',
    );

    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION ' +
        'public.record_raw_material_quality_inspection(',
    );

    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION ' +
        'public.decide_raw_material_quality_release(',
    );
  });
});