import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/lib/auth/guards/auth.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { hasPermission } from '@/lib/auth/permissions/permissions.service';

const ACTIONS_FILE = '../../../app/(admin)/units-of-measure/actions.ts';

function actionSource(action: string): string {
  const source = readFileSync(new URL(ACTIONS_FILE, import.meta.url), 'utf8');
  const declaration = `export async function ${action}`;
  const start = source.indexOf(declaration);

  if (start === -1) throw new Error(`Acción no encontrada: ${action}`);

  const next = source.indexOf('export async function ', start + declaration.length);

  return source.slice(start, next === -1 ? undefined : next);
}

function actor(role: 'admin' | 'customer'): AuthorizationActor {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles: [role],
    authorizationSource: 'legacy_user_roles',
  };
}

describe('autorización de unidades de medida', () => {
  it('define un permiso específico', () => {
    expect(PERMISSIONS.INVENTORY_UNIT_MANAGE).toBe('inventory.unit.manage');
  });

  it('autoriza administradores y bloquea clientes', () => {
    expect(hasPermission(actor('admin'), PERMISSIONS.INVENTORY_UNIT_MANAGE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.INVENTORY_UNIT_MANAGE)).toBe(false);
  });

  it.each(['createUnitOfMeasure', 'updateUnitOfMeasure', 'deleteUnitOfMeasure'])(
    'protege %s antes de escribir',
    (action) => {
      const source = actionSource(action);
      const guard = source.indexOf('requireTypedAuthorizedAction(');
      const write = source.indexOf(".from('units_of_measure')");

      expect(guard >= 0).toBe(true);
      expect(source.includes('PERMISSIONS.INVENTORY_UNIT_MANAGE')).toBe(true);
      expect(write > guard).toBe(true);
    },
  );

  it('comprueba referencias antes de eliminar', () => {
    const source = actionSource('deleteUnitOfMeasure');
    const guard = source.indexOf('assertUnitOfMeasureCanBeDeleted(');
    const write = source.indexOf(".from('units_of_measure')");

    expect(guard >= 0).toBe(true);
    expect(write > guard).toBe(true);
  });

  it.each([
    '../../../app/(admin)/units-of-measure/page.tsx',
    '../../../app/(admin)/units-of-measure/[id]/edit/page.tsx',
  ])('usa cliente tipado y elimina any en %s', (page) => {
    const source = readFileSync(new URL(page, import.meta.url), 'utf8');

    expect(source.includes('createTypedClient(')).toBe(true);
    expect(source.includes('createClient(')).toBe(false);
    expect(source.includes(': any')).toBe(false);
  });
});
