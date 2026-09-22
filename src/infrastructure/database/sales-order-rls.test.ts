import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const RLS = '../../../supabase/migrations/20260816000000_harden_sales_order_rls.sql';
const FUNCTIONS = '../../../supabase/migrations/20260816010000_add_sales_order_functions.sql';
const BEHAVIOR = '../../../supabase/tests/database/rls_behavior.sql';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('RLS de órdenes de venta', () => {
  it.each([
    'sales_orders', 'sales_order_items', 'sales_order_profit',
    'inventory_reservations', 'picking_orders', 'picking_order_items',
  ])(
    'limita escritura administrativa y conserva lectura autenticada en %s', (table) => {
      const migration = source(RLS);
      expect(migration).toContain(`CREATE POLICY ${table}_authenticated_read`);
      expect(migration).toContain(`CREATE POLICY ${table}_admin_write`);
      expect(migration).toContain('USING (public.is_admin(auth.uid()))');
      expect(migration).toContain('WITH CHECK (public.is_admin(auth.uid()))');
    },
  );

  it.each([
    'add_sales_order_item', 'confirm_sales_order',
    'transition_sales_order', 'confirm_picking_item', 'deliver_sales_order',
  ])('protege y revoca ejecución directa de %s', (name) => {
    const migration = source(FUNCTIONS);
    expect(migration).toContain(`FUNCTION public.${name}`);
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain('public.is_admin(auth.uid())');
    expect(migration).toContain('FROM PUBLIC, anon, service_role');
  });

  it('confirma y entrega bajo bloqueo sin permitir existencias negativas', () => {
    const migration = source(FUNCTIONS);
    expect(migration).toContain('FOR UPDATE');
    expect(migration).toContain('inventory_available_to_promise');
    expect(migration).toContain('Stock insuficiente');
    expect(migration).toContain('product_lot.quantity >= required_quantity');
    expect(migration).toContain("picking_status IS DISTINCT FROM 'completed'");
  });

  it('incluye pruebas SQL para usuario normal y administrador', () => {
    const behavior = source(BEHAVIOR);
    expect(behavior).toContain('normal user unexpectedly inserted a sales order');
    expect(behavior).toContain('admin sales order insert was not persisted');
  });
});
