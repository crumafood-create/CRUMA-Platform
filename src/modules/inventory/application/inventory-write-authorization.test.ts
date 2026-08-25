import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/lib/auth/guards/auth.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { hasPermission } from '@/lib/auth/permissions/permissions.service';

type ActionContract = {
  file: string;
  action: string;
  permission: keyof typeof PERMISSIONS;
};

const MATERIAL_ACTIONS = '../../../app/(admin)/raw-materials/actions.ts';
const MOVEMENT_ACTIONS = '../../../app/(admin)/inventory/actions.ts';
const ADJUSTMENT_ACTIONS = '../../../app/(admin)/inventory/adjustments/actions.ts';

const INVENTORY_ACTIONS: ActionContract[] = [
  {
    file: MATERIAL_ACTIONS,
    action: 'createRawMaterial',
    permission: 'INVENTORY_MATERIAL_MANAGE',
  },
  {
    file: MATERIAL_ACTIONS,
    action: 'updateRawMaterial',
    permission: 'INVENTORY_MATERIAL_MANAGE',
  },
  {
    file: MATERIAL_ACTIONS,
    action: 'deleteRawMaterial',
    permission: 'INVENTORY_MATERIAL_MANAGE',
  },
  {
    file: MOVEMENT_ACTIONS,
    action: 'createInventoryMovement',
    permission: 'INVENTORY_MOVEMENT_CREATE',
  },
  {
    file: ADJUSTMENT_ACTIONS,
    action: 'createInventoryAdjustment',
    permission: 'INVENTORY_ADJUSTMENT_CREATE',
  },
];

function actor(role: 'admin' | 'customer'): AuthorizationActor {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles: [role],
    authorizationSource: 'legacy_user_roles',
  };
}

function actionSource(contract: ActionContract): string {
  const source = readFileSync(new URL(contract.file, import.meta.url), 'utf8');
  const declaration = `export async function ${contract.action}`;
  const start = source.indexOf(declaration);

  if (start === -1) throw new Error(`Acción no encontrada: ${contract.action}`);

  const nextAction = source.indexOf('export async function ', start + declaration.length);

  return source.slice(start, nextAction === -1 ? undefined : nextAction);
}

describe('permisos canónicos de escritura de inventario', () => {
  it('separa materiales, movimientos y ajustes', () => {
    expect(PERMISSIONS.INVENTORY_MATERIAL_MANAGE).toBe('inventory.material.manage');
    expect(PERMISSIONS.INVENTORY_MOVEMENT_CREATE).toBe('inventory.movement.create');
    expect(PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE).toBe('inventory.adjustment.create');
  });

  it.each([
    'INVENTORY_MATERIAL_MANAGE',
    'INVENTORY_MOVEMENT_CREATE',
    'INVENTORY_ADJUSTMENT_CREATE',
  ] as const)('admin recibe el permiso específico %s', (permission) => {
    expect(hasPermission(actor('admin'), PERMISSIONS[permission])).toBe(true);
  });

  it.each([
    'INVENTORY_MATERIAL_MANAGE',
    'INVENTORY_MOVEMENT_CREATE',
    'INVENTORY_ADJUSTMENT_CREATE',
  ] as const)('customer no recibe el permiso específico %s', (permission) => {
    expect(hasPermission(actor('customer'), PERMISSIONS[permission])).toBe(false);
  });
});

describe('guardas obligatorias de escritura de inventario', () => {
  it.each(INVENTORY_ACTIONS)('protege la acción %j antes de escribir', (contract) => {
    const source = actionSource(contract);
    const guardIndex = source.indexOf('requireTypedAuthorizedAction(');
    const writeIndex = source.indexOf('.from(');

    expect(guardIndex >= 0).toBe(true);
    expect(source.includes(`PERMISSIONS.${contract.permission}`)).toBe(true);
    expect(writeIndex > guardIndex).toBe(true);
  });
});
