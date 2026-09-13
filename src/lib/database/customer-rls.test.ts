import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function migrationSource(): string {
  return readFileSync(resolve(process.cwd(), 'supabase/migrations/20260913000000_harden_customer_rls.sql'), 'utf8');
}

describe('RLS de clientes', () => {
  it('reemplaza escrituras abiertas por una política administrativa', () => {
    const migration = migrationSource();
    expect(migration).toContain('DROP POLICY IF EXISTS customers_insert');
    expect(migration).toContain('DROP POLICY IF EXISTS customers_update');
    expect(migration).toContain('CREATE POLICY customers_admin_write');
    expect(migration).toContain('USING (public.is_admin(auth.uid()))');
    expect(migration).toContain('WITH CHECK (public.is_admin(auth.uid()))');
  });
});
