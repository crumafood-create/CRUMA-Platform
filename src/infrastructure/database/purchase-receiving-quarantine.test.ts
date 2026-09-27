import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/' +
  '20260927010000_harden_purchase_receiving_quarantine.sql';

function source(path: string): string {
  return readFileSync(
    new URL(path, import.meta.url),
    'utf8',
  );
}

function normalizeSql(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

function functionSource(
  sql: string,
  functionName: string,
): string {
  const start = sql.indexOf(
    `CREATE OR REPLACE FUNCTION public.${functionName}`,
  );

  expect(start).toBeGreaterThanOrEqual(0);

  const end = sql.indexOf('$$;', start);

  expect(end).toBeGreaterThan(start);

  return sql.slice(start, end + 3);
}

describe('recepción de compras en cuarentena', () => {
  it('crea un documento de recepción auditable', () => {
  const migration = normalizeSql(
    source(MIGRATION),
  );

    expect(migration).toContain(
      'CREATE TABLE public.purchase_receipts',
    );
    expect(migration).toContain(
      'CREATE TABLE public.purchase_receipt_items',
    );
    expect(migration).toContain(
      'purchase_order_id uuid NOT NULL',
    );
    expect(migration).toContain(
      'purchase_order_item_id uuid NOT NULL',
    );
    expect(migration).toContain(
      'raw_material_lot_id uuid NOT NULL',
    );
    expect(migration).toContain(
      'received_by uuid NOT NULL',
    );
    expect(migration).toContain(
      'idempotency_key uuid NOT NULL UNIQUE',
    );
  });

  it('recibe cantidades parciales de forma idempotente', () => {
    const migration = source(MIGRATION);
    const receipt = normalizeSql(
     functionSource(
     migration,
    'receive_purchase_order_lot',
  ),
);

    expect(receipt).toContain('p_quantity numeric');
    expect(receipt).toContain(
      'p_idempotency_key uuid',
    );
    expect(receipt).toContain(
      'WHERE id = p_item_id FOR UPDATE',
    );
    expect(receipt).toContain(
      'pending := item.quantity - item.received_quantity',
    );
    expect(receipt).toContain(
      'p_quantity > pending',
    );
    expect(receipt).toContain(
      'received_quantity = received_quantity + p_quantity',
    );
    expect(receipt).toContain(
      'p_idempotency_key::text',
    );
    expect(receipt).toContain(
      'pg_advisory_xact_lock',
    );
  });

  it('crea existencia física sin volverla disponible', () => {
    const migration = source(MIGRATION);
    const receipt = normalizeSql(
      functionSource(
        migration,
        'receive_purchase_order_lot',
      ),
    );

    const normalizedMigration =
  normalizeSql(migration);

    expect(receipt).toContain(
      'INSERT INTO public.raw_material_lots',
    );
    expect(receipt).toContain("'quarantine'");
    expect(receipt).not.toContain(
      'public.receive_purchase_order_item',
    );
    expect(receipt).not.toContain(
      'UPDATE public.raw_materials',
    );
    expect(receipt).not.toContain(
      'INSERT INTO public.inventory_movements',
    );

   expect(normalizedMigration).toContain(
  'CREATE TRIGGER raw_material_lot_quantity_guard BEFORE UPDATE OF quantity ON public.raw_material_lots',
);

expect(normalizedMigration).toContain(
  "IF OLD.status <> 'available' AND NEW.quantity IS DISTINCT FROM OLD.quantity THEN",
);

expect(normalizedMigration).toContain(
  'Quarantined raw material lot quantity cannot be changed.',
);
  });

  it('protege las tablas y la función de recepción', () => {
    const migration = normalizeSql(
  source(MIGRATION),
);

    for (const table of [
      'purchase_receipts',
      'purchase_receipt_items',
    ]) {
      expect(migration).toContain(
        `ALTER TABLE public.${table} ` +
          'ENABLE ROW LEVEL SECURITY',
      );
    }

    expect(migration).toContain(
      'DROP FUNCTION IF EXISTS ' +
        'public.receive_purchase_order_lot' +
        '(uuid, text, date, uuid)',
    );
    expect(migration).toContain(
      'FROM PUBLIC, anon, service_role',
    );
    expect(migration).toContain(
      'TO authenticated',
    );
  });
});