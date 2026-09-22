import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION = '../../../supabase/migrations/20260810000000_harden_unit_of_measure_rls.sql';
const RLS_BEHAVIOR = '../../../supabase/tests/database/rls_behavior.sql';

function migrationSource(): string {
  return readFileSync(new URL(MIGRATION, import.meta.url), 'utf8');
}

describe('RLS de unidades de medida', () => {
  it('elimina las políticas de escritura abiertas', () => {
    const source = migrationSource();

    expect(source).toContain('DROP POLICY IF EXISTS units_of_measure_insert');
    expect(source).toContain('DROP POLICY IF EXISTS units_of_measure_update');
    expect(source).toContain('DROP POLICY IF EXISTS units_of_measure_delete');
  });

  it('restringe escritura a administradores autenticados', () => {
    const source = migrationSource();

    expect(source).toContain('FOR ALL');
    expect(source).toContain('TO authenticated');
    expect(source).toContain('USING (public.is_admin(auth.uid()))');
    expect(source).toContain('WITH CHECK (public.is_admin(auth.uid()))');
  });

  it('mantiene separadas las políticas públicas de lectura', () => {
    expect(migrationSource()).not.toContain('DROP POLICY IF EXISTS "Allow read units"');
  });

  it('incluye pruebas SQL para clientes y administradores', () => {
    const source = readFileSync(new URL(RLS_BEHAVIOR, import.meta.url), 'utf8');

    expect(source).toContain('normal user unexpectedly inserted a unit');
    expect(source).toContain('RLS Main Unit Updated By Admin');
    expect(source).toContain('admin unit insert was not persisted');
  });
});
