import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/lib/auth/guards/auth.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { hasPermission } from '@/lib/auth/permissions/permissions.service';

const RECIPE_ACTIONS = '../../../app/(admin)/recipes/actions.ts';
const ITEM_ACTIONS = '../../../app/(admin)/recipes/[id]/ingredients/actions.ts';

function actor(role: 'admin' | 'customer'): AuthorizationActor {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles: [role],
    authorizationSource: 'legacy_user_roles',
  };
}

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('autorización de recetas', () => {
  it('define un permiso específico', () => {
    expect(PERMISSIONS.PRODUCTION_RECIPE_MANAGE).toBe('production.recipe.manage');
  });

  it('autoriza administradores y bloquea clientes', () => {
    expect(hasPermission(actor('admin'), PERMISSIONS.PRODUCTION_RECIPE_MANAGE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.PRODUCTION_RECIPE_MANAGE)).toBe(false);
  });

  it.each([
    [RECIPE_ACTIONS, ".from('recipes')"],
    [ITEM_ACTIONS, ".from('recipe_items')"],
  ])('protege la escritura en %s', (path, writeCall) => {
    const action = source(path);
    const guard = action.indexOf('requireTypedAuthorizedAction(');
    const write = action.indexOf(writeCall);

    expect(guard >= 0).toBe(true);
    expect(action).toContain('PERMISSIONS.PRODUCTION_RECIPE_MANAGE');
    expect(write > guard).toBe(true);
  });

  it('escribe la columna tipada raw_material_id', () => {
    const action = source(ITEM_ACTIONS);

    expect(action).toContain('raw_material_id');
    expect(action).not.toContain('ingredient_id');
  });

  it.each([
    '../../../app/(admin)/recipes/page.tsx',
    '../../../app/(admin)/recipes/new/page.tsx',
    '../../../app/(admin)/recipes/[id]/page.tsx',
    '../../../app/(admin)/recipes/[id]/ingredients/page.tsx',
  ])('usa cliente Supabase tipado en %s', (path) => {
    const page = source(path);

    expect(page).toContain('createTypedClient(');
    expect(page).not.toContain('createClient(');
  });
});
