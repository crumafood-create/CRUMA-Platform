import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION = '../../../supabase/migrations/20260815000000_harden_purchase_order_rls.sql';
const RECEIPT = '../../../supabase/migrations/20260815010000_add_purchase_order_receipt_functions.sql';
const LOT_RECEIPT = '../../../supabase/migrations/20260815020000_add_purchase_order_lot_receipt.sql';
const ADD_ITEM = '../../../supabase/migrations/20260815030000_add_purchase_order_item_function.sql';
const RLS_BEHAVIOR = '../../../supabase/tests/database/rls_behavior.sql';
const CI_WORKFLOW = '../../../.github/workflows/ci.yml';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('RLS de órdenes de compra', () => {
  it.each(['purchase_orders', 'purchase_order_items'])(
    'habilita lectura autenticada y escritura administrativa en %s',
    (table) => {
      const migration = source(MIGRATION);
      expect(migration).toContain(`CREATE POLICY ${table}_authenticated_read`);
      expect(migration).toContain(`CREATE POLICY ${table}_admin_write`);
      expect(migration).toContain('USING (public.is_admin(auth.uid()))');
      expect(migration).toContain('WITH CHECK (public.is_admin(auth.uid()))');
    },
  );

  it('incluye pruebas SQL de escritura para clientes y administradores', () => {
    const behavior = source(RLS_BEHAVIOR);
    expect(behavior).toContain('normal user unexpectedly inserted a purchase order');
    expect(behavior).toContain('admin purchase order insert was not persisted');
    expect(behavior).toContain('purchase order RLS write outcomes are inconsistent');
  });

  it('recibe solo saldos pendientes bajo bloqueo y conserva decimales', () => {
    const migration = source(RECEIPT);
    expect(migration).toContain('ALTER COLUMN quantity TYPE numeric(18,4)');
    expect(migration).toContain('WHERE id = p_item_id FOR UPDATE');
    expect(migration).toContain('pending := item.quantity - item.received_quantity');
    expect(migration).toContain("order_status NOT IN ('released', 'partially_received')");
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain('public.is_admin(auth.uid())');
  });

  it('recrea las vistas dependientes y restaura sus permisos', () => {
    const migration = source(RECEIPT);
    for (const view of [
      'mrp_purchase_requirements',
      'inventory_available_to_promise',
      'inventory_stock_by_item',
      'inventory_stock',
    ]) {
      expect(migration).toContain(`DROP VIEW public.${view}`);
      expect(migration).toContain(`CREATE VIEW public.${view}`);
      expect(migration).toContain(
        `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${view} TO anon, authenticated`,
      );
      expect(migration).toContain(`GRANT ALL ON TABLE public.${view} TO service_role`);
      expect(migration).not.toContain(
        `GRANT ALL ON TABLE public.${view} TO anon, authenticated, service_role`,
      );
    }
  });

  it('expone el diagnóstico de Supabase cuando el arranque falla', () => {
    const workflow = source(CI_WORKFLOW);
    expect(workflow).toContain('cat /tmp/supabase-start.log');
    expect(workflow).toContain('pnpm db:types:generate');
    expect(workflow).toContain('git diff -- src/types/database/database.generated.ts');
  });

  it('revoca ejecución directa a roles no autorizados', () => {
    for (const migration of [source(RECEIPT), source(LOT_RECEIPT), source(ADD_ITEM)]) {
      expect(migration).toContain('FROM PUBLIC, anon, service_role');
    }
  });

  it('crea lote y recepción móvil en una misma transacción protegida', () => {
    const migration = source(LOT_RECEIPT);
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('INSERT INTO public.raw_material_lots');
    expect(migration).toContain('public.receive_purchase_order_item(item.id, pending)');
    expect(migration).toContain('public.is_admin(auth.uid())');
  });

  it('agrega renglones y recalcula totales dentro de una transacción', () => {
    const migration = source(ADD_ITEM);
    expect(migration).toContain('WHERE id = p_order_id AND deleted_at IS NULL FOR UPDATE');
    expect(migration).toContain('INSERT INTO public.purchase_order_items');
    expect(migration).toContain('SELECT coalesce(sum(total), 0) INTO order_total');
    expect(migration).toContain('public.is_admin(auth.uid())');
  });
});
