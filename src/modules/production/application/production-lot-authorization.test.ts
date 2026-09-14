import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/lib/auth/guards/auth.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { hasPermission } from '@/lib/auth/permissions/permissions.service';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const actor = (role: 'admin' | 'customer'): AuthorizationActor => ({
  userId: 'a1000000-0000-0000-0000-000000000001',
  roles: [role],
  authorizationSource: 'legacy_user_roles',
});

describe('autorización de lotes producidos', () => {
  it('reserva la liberación para administradores', () => {
    expect(PERMISSIONS.PRODUCTION_LOT_RELEASE).toBe('production.lot.release');
    expect(hasPermission(actor('admin'), 'production.lot.release')).toBe(true);
    expect(hasPermission(actor('customer'), 'production.lot.release')).toBe(false);
  });

  it('delega la escritura a una RPC autorizada', () => {
    const action = source('src/app/(admin)/lots/actions.ts');
    expect(action).toContain('PERMISSIONS.PRODUCTION_LOT_RELEASE');
    expect(action).toContain('releaseProductionOutputToInventory(');
    expect(action).not.toContain(".from('product_lots')");
    expect(action).not.toContain(".from('inventory_movements')");
  });

  it('mantiene el picking dentro de la RPC protegida', () => {
    const action = source('src/app/mobile/picking/[id]/actions.ts');
    expect(action).toContain("rpc('confirm_picking_item'");
    expect(action).not.toContain(".update({");
    expect(action).not.toContain(".insert({");
  });
});
