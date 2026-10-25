import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/20261002140000_add_operational_scope_hierarchy.sql';

function migration(): string {
  return readFileSync(new URL(MIGRATION, import.meta.url), 'utf8');
}

describe('jerarquía operativa de scopes', () => {
  it('persiste organización y planta dentro del tenant', () => {
    const sql = migration();

    expect(sql).toContain('CREATE TABLE public.organizations');
    expect(sql).toContain('CREATE TABLE public.plants');
    expect(sql).toContain(
      'CONSTRAINT plants_tenant_id_organization_id_fkey',
    );
    expect(sql).toContain(
      'FOREIGN KEY (tenant_id, organization_id)',
    );
    expect(sql).toContain(
      'FOREIGN KEY (tenant_id, plant_id)',
    );
    expect(sql).toContain('UNIQUE (tenant_id, code)');
  });

  it('no obliga a los almacenes existentes a inventar un tenant', () => {
    const sql = migration();

    expect(sql).toContain('ADD COLUMN tenant_id uuid');
    expect(sql).toContain('ADD COLUMN plant_id uuid');
    expect(sql).toContain(
      '(tenant_id IS NULL AND plant_id IS NULL)',
    );
    expect(sql).not.toContain('ALTER COLUMN tenant_id SET NOT NULL');
    expect(sql).not.toContain('UPDATE public.warehouses');
  });

  it('conserva user_roles como única autoridad', () => {
    const sql = migration();

    expect(sql).toContain('public.is_admin(auth.uid())');
    expect(sql).not.toContain('tenant_members.role');
    expect(sql).not.toContain('user_admin_permissions');
    expect(sql).not.toContain('DROP POLICY');
    expect(sql).not.toContain('CREATE OR REPLACE FUNCTION public.is_admin');
  });
});
