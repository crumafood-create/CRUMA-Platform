import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  inventoryRlsAuthority,
  summarizeRlsDependencies,
} from './rls-authority-inventory';

const MIGRATION =
  '../../../supabase/pending/20261009163000_harden_open_operational_writes.sql';

const OPEN_WRITES = [
  'families.allow authenticated delete',
  'families.allow authenticated inserts',
  'families.allow authenticated update',
  'categories.authenticated_can_manage_categories',
  'inventory_locations.inventory_locations_delete',
  'inventory_locations.inventory_locations_insert',
  'inventory_locations.inventory_locations_update',
  'inventory_movements.inventory_movements_delete',
  'inventory_movements.inventory_movements_insert',
  'inventory_movements.inventory_movements_update',
  'raw_materials.raw_materials_delete',
  'raw_materials.raw_materials_insert',
  'raw_materials.raw_materials_update',
] as const;

function source(): string {
  return readFileSync(new URL(MIGRATION, import.meta.url), 'utf8');
}

describe('cierre preparado de escrituras operativas abiertas', () => {
  it('conserva las 13 escrituras abiertas mientras no exista prueba PostgreSQL', () => {
    const summary = summarizeRlsDependencies();
    const openWrites = inventoryRlsAuthority()
      .filter((policy) => policy.open && policy.command !== 'select')
      .map((policy) => `${policy.table}.${policy.policy}`);

    expect(summary.openWrites).toBe(13);
    expect(openWrites).toEqual([...OPEN_WRITES]);
  });

  it('prepara el reemplazo administrativo sin tocar lecturas ni autoridad', () => {
    const migration = source();

    expect(migration).toContain('DROP POLICY IF EXISTS "Allow authenticated delete"');
    expect(migration).toContain('CREATE POLICY families_admin_write');
    expect(migration).toContain('CREATE POLICY categories_admin_write');
    expect(migration).toContain('CREATE POLICY inventory_locations_admin_write');
    expect(migration).toContain('CREATE POLICY inventory_movements_admin_write');
    expect(migration).toContain('CREATE POLICY raw_materials_admin_write');
    expect(migration).toContain('USING (public.is_admin(auth.uid()))');
    expect(migration).toContain('WITH CHECK (public.is_admin(auth.uid()))');
    expect(migration).not.toContain('DROP POLICY IF EXISTS "Allow authenticated select"');
    expect(migration).not.toContain('tenant_members');
    expect(migration).not.toContain('UPDATE public.');
  });
});
