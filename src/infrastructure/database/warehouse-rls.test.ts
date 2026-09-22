import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION = '../../../supabase/migrations/20260813000000_harden_warehouse_rls.sql';
const RLS_BEHAVIOR = '../../../supabase/tests/database/rls_behavior.sql';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('RLS de almacenes', () => {
  it('elimina las políticas de escritura abiertas y heredadas', () => {
    const migration = source(MIGRATION);

    expect(migration).toContain('DROP POLICY IF EXISTS admin_all_warehouses');
    expect(migration).toContain('DROP POLICY IF EXISTS warehouses_insert');
    expect(migration).toContain('DROP POLICY IF EXISTS warehouses_update');
    expect(migration).toContain('DROP POLICY IF EXISTS warehouses_delete');
  });

  it('restringe escritura a administradores autenticados', () => {
    const migration = source(MIGRATION);

    expect(migration).toContain('CREATE POLICY warehouses_admin_write');
    expect(migration).toContain('TO authenticated');
    expect(migration).toContain('USING (public.is_admin(auth.uid()))');
    expect(migration).toContain('WITH CHECK (public.is_admin(auth.uid()))');
  });

  it('incluye pruebas SQL para clientes y administradores', () => {
    const behavior = source(RLS_BEHAVIOR);

    expect(behavior).toContain('normal user unexpectedly inserted a warehouse');
    expect(behavior).toContain('admin warehouse insert was not persisted');
    expect(behavior).toContain('warehouse RLS write outcomes are inconsistent');
  });
});
