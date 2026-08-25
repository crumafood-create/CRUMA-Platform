import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/lib/auth/guards/auth.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { hasPermission } from '@/lib/auth/permissions/permissions.service';

const ACTIONS_FILE = '../../../app/(admin)/inventory-locations/actions.ts';

function actionSource(action: string): string {
  const source = readFileSync(new URL(ACTIONS_FILE, import.meta.url), 'utf8');
  const declaration = `export async function ${action}`;
  const start = source.indexOf(declaration);

  if (start === -1) throw new Error(`Acción no encontrada: ${action}`);

  const nextAction = source.indexOf('export async function ', start + declaration.length);

  return source.slice(start, nextAction === -1 ? undefined : nextAction);
}

function actor(role: 'admin' | 'customer'): AuthorizationActor {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles: [role],
    authorizationSource: 'legacy_user_roles',
  };
}

describe('autorización de ubicaciones de inventario', () => {
  it('define un permiso exclusivo para administrar ubicaciones', () => {
    expect(PERMISSIONS.INVENTORY_LOCATION_MANAGE).toBe('inventory.location.manage');
  });

  it('autoriza administradores y rechaza clientes', () => {
    expect(hasPermission(actor('admin'), PERMISSIONS.INVENTORY_LOCATION_MANAGE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.INVENTORY_LOCATION_MANAGE)).toBe(false);
  });

  it.each([
    'createInventoryLocation',
    'updateInventoryLocation',
    'deleteInventoryLocation',
  ])('protege la acción %s antes de escribir', (action) => {
    const source = actionSource(action);
    const guard = source.indexOf('requireTypedAuthorizedAction(');
    const write = source.indexOf(".from('inventory_locations')");

    expect(guard >= 0).toBe(true);
    expect(source.includes('PERMISSIONS.INVENTORY_LOCATION_MANAGE')).toBe(true);
    expect(write > guard).toBe(true);
  });

  it('comprueba referencias antes de eliminar una ubicación', () => {
    const source = actionSource('deleteInventoryLocation');
    const guard = source.indexOf('assertInventoryLocationCanBeDeleted(');
    const write = source.indexOf(".from('inventory_locations')");

    expect(guard >= 0).toBe(true);
    expect(write > guard).toBe(true);
  });

  it.each([
    '../../../app/(admin)/inventory-locations/page.tsx',
    '../../../app/(admin)/inventory-locations/[id]/edit/page.tsx',
  ])('utiliza el cliente tipado en %s', (page) => {
    const source = readFileSync(new URL(page, import.meta.url), 'utf8');

    expect(source.includes('createTypedClient(')).toBe(true);
    expect(source.includes('createClient(')).toBe(false);
  });
});
