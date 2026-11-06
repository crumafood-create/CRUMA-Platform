import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/20261107080000_defer_operational_hierarchy.sql';

function migration(): string {
  return readFileSync(new URL(MIGRATION, import.meta.url), 'utf8');
}

describe('aplazamiento de scopes de organización y planta', () => {
  it('detiene la migración si existen datos o asignaciones', () => {
    const sql = migration();

    expect(sql).toContain('LOCK TABLE public.organizations, public.plants, public.warehouses');
    expect(sql).toContain('FROM public.organizations');
    expect(sql).toContain('FROM public.plants');
    expect(sql).toContain('WHERE tenant_id IS NOT NULL');
    expect(sql).toContain('WHERE plant_id IS NOT NULL');
    expect(sql.match(/USING ERRCODE = '55000'/g)).toHaveLength(4);
  });

  it('retira los objetos de jerarquía explícitamente y conserva los tenants', () => {
    const sql = migration().toLowerCase();

    expect(sql).toContain(
      'drop policy if exists organizations_admin_write on public.organizations',
    );
    expect(sql).toContain(
      'drop policy if exists plants_admin_write on public.plants',
    );
    expect(sql).toContain('drop constraint if exists warehouses_plant_scope_fkey');
    expect(sql).toContain('drop constraint if exists warehouses_scope_pair_check');
    expect(sql).toContain('drop column if exists tenant_id');
    expect(sql).toContain('drop column if exists plant_id');
    expect(sql).toContain('drop table if exists public.plants');
    expect(sql).toContain('drop table if exists public.organizations');
    expect(sql).not.toContain('cascade');
    expect(sql).not.toContain('drop table public.warehouses');
    expect(sql).not.toContain('drop table public.tenants');
    expect(sql).not.toContain('drop table public.tenant_members');
  });
});
