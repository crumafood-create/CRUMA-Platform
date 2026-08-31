import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION = '../../../supabase/migrations/20260812000000_harden_recipe_rls.sql';
const RLS_BEHAVIOR = '../../../supabase/tests/database/rls_behavior.sql';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('RLS de recetas', () => {
  it.each(['recipes', 'recipe_items'])(
    'elimina las políticas abiertas de %s',
    (table) => {
      const migration = source(MIGRATION);

      expect(migration).toContain(`DROP POLICY IF EXISTS ${table}_insert`);
      expect(migration).toContain(`DROP POLICY IF EXISTS ${table}_update`);
      expect(migration).toContain(`DROP POLICY IF EXISTS ${table}_delete`);
    },
  );

  it.each(['recipes_admin_write', 'recipe_items_admin_write'])(
    'restringe %s a administradores autenticados',
    (policy) => {
      const migration = source(MIGRATION);

      expect(migration).toContain(`CREATE POLICY ${policy}`);
      expect(migration).toContain('TO authenticated');
      expect(migration).toContain('USING (public.is_admin(auth.uid()))');
      expect(migration).toContain('WITH CHECK (public.is_admin(auth.uid()))');
    },
  );

  it('incluye pruebas SQL para clientes y administradores', () => {
    const behavior = source(RLS_BEHAVIOR);

    expect(behavior).toContain('normal user unexpectedly inserted a recipe');
    expect(behavior).toContain('normal user unexpectedly inserted a recipe item');
    expect(behavior).toContain('admin recipe insert was not persisted');
    expect(behavior).toContain('admin recipe item insert was not persisted');
  });
});
