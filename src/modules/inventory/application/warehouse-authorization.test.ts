import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/lib/auth/guards/auth.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { hasPermission } from '@/lib/auth/permissions/permissions.service';

const ACTIONS = '../../../app/(admin)/warehouses/actions.ts';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

function actionSource(action: string): string {
  const file = source(ACTIONS);
  const start = file.indexOf(`export async function ${action}`);
  const next = file.indexOf('export async function ', start + 1);

  if (start < 0) throw new Error(`Acción no encontrada: ${action}`);

  return file.slice(start, next < 0 ? undefined : next);
}

function actor(role: 'admin' | 'customer'): AuthorizationActor {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles: [role],
    authorizationSource: 'legacy_user_roles',
  };
}

describe('autorización de almacenes', () => {
  it('define un permiso específico', () => {
    expect(PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE).toBe('inventory.warehouse.manage');
  });

  it('autoriza administradores y bloquea clientes', () => {
    expect(hasPermission(actor('admin'), PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE)).toBe(false);
  });

  it.each(['createWarehouse', 'updateWarehouse', 'deleteWarehouse'])(
    'protege %s antes de escribir',
    (action) => {
      const actionBody = actionSource(action);
      const guard = actionBody.indexOf('requireTypedAuthorizedAction(');
      const write = actionBody.indexOf(".from('warehouses')");

      expect(guard >= 0).toBe(true);
      expect(actionBody).toContain('PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE');
      expect(write > guard).toBe(true);
    },
  );

  it('comprueba referencias antes de eliminar físicamente', () => {
    const action = actionSource('deleteWarehouse');

    expect(action.indexOf('assertWarehouseCanBeDeleted(')).toBeLessThan(
      action.indexOf(".from('warehouses')"),
    );
    expect(action).toContain('.delete()');
    expect(action).not.toContain('deleted_at');
  });

  it.each([
    '../../../app/(admin)/warehouses/page.tsx',
    '../../../app/(admin)/warehouses/[id]/edit/page.tsx',
  ])('usa cliente Supabase tipado en %s', (path) => {
    expect(source(path)).toContain('createTypedClient(');
    expect(source(path)).not.toContain('createClient(');
  });
});
