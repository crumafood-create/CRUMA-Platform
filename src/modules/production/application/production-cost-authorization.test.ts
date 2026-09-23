import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/modules/identity/guards/types';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { hasPermission } from '@/modules/identity/permissions/permissions.service';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const actor = (role: 'admin' | 'customer'): AuthorizationActor => ({
  userId: 'c1000000-0000-0000-0000-000000000001', roles: [role],
  authorizationSource: 'legacy_user_roles',
});

describe('autorización de costos de producción', () => {
  it('reserva el cálculo para administradores', () => {
    expect(PERMISSIONS.PRODUCTION_COST_CALCULATE).toBe('production.cost.calculate');
    expect(hasPermission(actor('admin'), PERMISSIONS.PRODUCTION_COST_CALCULATE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.PRODUCTION_COST_CALCULATE)).toBe(false);
  });

  it('autoriza antes de calcular y elimina escrituras directas', () => {
    const action = source('src/app/(admin)/production-costs/actions.ts');
    expect(action).toContain('requireTypedAuthorizedAction(');
    expect(action).toContain('PERMISSIONS.PRODUCTION_COST_CALCULATE');
    expect(action).toContain('persistProductionCost(');
    expect(action).not.toContain(".from('production_costs')");
    expect(action).not.toContain(".from('production_lot_consumptions')");
  });

  it.each([
    'src/app/(admin)/production-costs/page.tsx',
    'src/app/(admin)/production-costs/[id]/page.tsx',
  ])('usa cliente tipado y elimina any en %s', (path) => {
    const page = source(path);
    expect(page).toContain('createTypedClient(');
    expect(page).not.toContain('createClient(');
    expect(page).not.toContain(': any');
  });

  it('captura costo unitario y total al registrar el consumo', () => {
    const lot = source('src/modules/production/application/production-lot.ts');
    const movement = source('src/modules/production/application/production-movements.ts');
    expect(lot).toContain('unit_cost');
    expect(movement).toContain('unit_cost:');
    expect(movement).toContain('total_cost:');
  });
});
