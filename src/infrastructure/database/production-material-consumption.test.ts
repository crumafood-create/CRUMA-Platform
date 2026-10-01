import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/' +
  '20260928020000_harden_production_material_consumption.sql';

const DATABASE_TEST =
  '../../../supabase/tests/database/' +
  'production_material_consumption.sql';

const PACKAGE_JSON = '../../../package.json';

const FUNCTION_SECURITY =
  '../../../supabase/tests/database/' +
  'function_security.sql';

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

describe('consumo transaccional de materia prima', () => {
  it('registra operaciones idempotentes y auditables', () => {
    const migration = normalizeSql(source());

    expect(migration).toContain(
      'CREATE TABLE public.production_material_consumption_operations',
    );
    expect(migration).toContain(
      'idempotency_key uuid NOT NULL UNIQUE',
    );
    expect(migration).toContain(
      'production_order_item_id uuid NOT NULL',
    );
    expect(migration).toContain(
      'raw_material_lot_id uuid NOT NULL',
    );
    expect(migration).toContain(
      'consumed_quantity numeric(18,4) NOT NULL',
    );
    expect(migration).toContain(
      'consumed_by uuid NOT NULL',
    );
  });

  it('bloquea el artículo y selecciona el siguiente lote FEFO válido', () => {
    const migration = normalizeSql(source());

    expect(migration).toContain(
      'CREATE OR REPLACE FUNCTION ' +
        'public.consume_production_material_fefo(',
    );
    expect(migration).toContain(
      'p_production_order_item_id uuid',
    );
    expect(migration).toContain(
      'p_scanned_lot_number text',
    );
    expect(migration).toContain(
      'p_idempotency_key uuid',
    );
    expect(migration).toContain(
      'WHERE id = p_production_order_item_id FOR UPDATE',
    );
    expect(migration).toContain(
      "lot.status = 'available'",
    );
    expect(migration).toContain(
      'lot.expiration_date IS NULL OR ' +
        'lot.expiration_date >= CURRENT_DATE',
    );
    expect(migration).toContain(
      'ORDER BY lot.expiration_date ASC NULLS LAST, ' +
        'lot.created_at ASC, lot.id ASC',
    );
    expect(migration).toContain(
      'FOR UPDATE',
    );
  });

  it('actualiza existencias, trazabilidad y estados en una sola función', () => {
    const migration = normalizeSql(source());

    expect(migration).toContain(
        'started_at = coalesce(started_at, now())',
      );

    expect(migration).toContain(
      'v_consumed_quantity := LEAST(',
    );
    expect(migration).toContain(
      'UPDATE public.raw_material_lots',
    );
    expect(migration).toContain(
      "THEN 'depleted'",
    );
    expect(migration).toContain(
      'UPDATE public.raw_materials',
    );
    expect(migration).toContain(
      'current_stock = current_stock - ' +
        'v_consumed_quantity',
    );
    expect(migration).toContain(
      'INSERT INTO public.production_order_consumptions',
    );
    expect(migration).toContain(
      'INSERT INTO public.inventory_movements',
    );
    expect(migration).toContain(
      'INSERT INTO ' +
        'public.production_material_consumption_operations',
    );
    expect(migration).toContain(
      'UPDATE public.production_order_items',
    );
    });
    it('usa el registro FEFO fuera del alcance del alias SQL', () => {
  const migration = normalizeSql(source());

  expect(migration).toContain(
    'SELECT lot.* INTO selected_lot',
  );
  expect(migration).toContain(
    'IF upper(btrim(selected_lot.lot_number))',
  );
  expect(migration).toContain(
    'WHERE id = selected_lot.id',
  );
  expect(migration).not.toContain(
    'IF upper(btrim(lot.lot_number))',
  );
});

  it('restringe la RPC y las tablas de auditoría', () => {
    const migration = normalizeSql(source());

    expect(migration).toContain(
      'SECURITY DEFINER SET search_path =',
    );
    expect(migration).toContain(
      'public.is_admin(auth.uid())',
    );
    expect(migration).toContain(
      'ENABLE ROW LEVEL SECURITY',
    );
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION ' +
        'public.consume_production_material_fefo(',
    );
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION ' +
        'public.consume_production_material_fefo(',
    );
    expect(migration).toContain(
      'TO authenticated',
    );
  });
    it(
    'integra la prueba SQL transaccional en la verificación de base de datos',
    () => {
      const databaseTest = normalizeSql(
        source(DATABASE_TEST),
      );

      const packageJson = source(PACKAGE_JSON);

      expect(databaseTest).toContain('BEGIN;');

      expect(databaseTest).toContain(
        'SET LOCAL ROLE authenticated;',
      );

      expect(databaseTest).toContain(
        'SELECT public.consume_production_material_fefo(',
      );

      expect(databaseTest).toContain(
        'FROM public.production_material_consumption_operations',
      );

      expect(databaseTest).toContain(
        "AND status = 'depleted'",
      );

      expect(databaseTest).toContain(
        "AND production_status = 'in_progress'",
      );

      expect(databaseTest).toContain(
        "WHEN insufficient_privilege THEN",
      );

      expect(databaseTest).toContain('ROLLBACK;');

      expect(packageJson).toContain(
        '"db:test:production-consumption": ' +
          '"bash scripts/database/run-database-test.sh ' +
          'supabase/tests/database/' +
          'production_material_consumption.sql"',
      );

      expect(packageJson).toContain(
  'pnpm run db:test:raw-material-quality && ' +
    'pnpm run db:test:production-consumption && ' +
    'pnpm run db:test:production-output && ' +
    'pnpm run db:test:production-yield && ' +
    'pnpm run db:test:finished-product-release && ' +
    'pnpm run db:test:lots',
);
    },
  );

    it(
    'gobierna la RPC de consumo como función segura',
    () => {
      const functionSecurity = source(
        FUNCTION_SECURITY,
      );

      const signature =
        'public.consume_production_material_fefo' +
        '(uuid,text,uuid)';

      const occurrences =
        functionSecurity.split(signature).length - 1;

      expect(occurrences).toBeGreaterThanOrEqual(4);
    },
  );
});