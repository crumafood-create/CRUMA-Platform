import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION = '../../../supabase/migrations/20260814000000_harden_supplier_rls.sql';
const RLS_BEHAVIOR = '../../../supabase/tests/database/rls_behavior.sql';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('RLS de proveedores', () => {
  it('elimina las políticas de escritura abiertas', () => {
    const migration = source(MIGRATION);
    expect(migration).toContain('DROP POLICY IF EXISTS suppliers_insert');
    expect(migration).toContain('DROP POLICY IF EXISTS suppliers_update');
    expect(migration).toContain('DROP POLICY IF EXISTS suppliers_delete');
  });

  it('restringe escritura a administradores autenticados', () => {
    const migration = source(MIGRATION);
    expect(migration).toContain('CREATE POLICY suppliers_admin_write');
    expect(migration).toContain('TO authenticated');
    expect(migration).toContain('USING (public.is_admin(auth.uid()))');
    expect(migration).toContain('WITH CHECK (public.is_admin(auth.uid()))');
  });

  it('incluye pruebas SQL para clientes y administradores', () => {
    const behavior = source(RLS_BEHAVIOR);
    expect(behavior).toContain('normal user unexpectedly inserted a supplier');
    expect(behavior).toContain('admin supplier insert was not persisted');
    expect(behavior).toContain('supplier RLS write outcomes are inconsistent');
  });
});
