import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/modules/identity/guards/types';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { hasPermission } from '@/modules/identity/permissions/permissions.service';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const actor = (role: 'admin' | 'customer'): AuthorizationActor => ({
  userId: 'd1000000-0000-0000-0000-000000000001',
  roles: [role],
  authorizationSource: 'legacy_user_roles',
});

describe('autorización de control de calidad', () => {
  it.each([
    ['QUALITY_INSPECTION_MANAGE', 'quality.inspection.manage'],
    ['QUALITY_RELEASE_DECIDE', 'quality.release.decide'],
  ] as const)('reserva %s para administradores', (key, permission) => {
    expect(PERMISSIONS[key]).toBe(permission);
    expect(hasPermission(actor('admin'), permission)).toBe(true);
    expect(hasPermission(actor('customer'), permission)).toBe(false);
  });

  it('autoriza las acciones y elimina escrituras directas', () => {
    const action = source('src/app/(admin)/qa/actions.ts');
    expect(action).toContain('PERMISSIONS.QUALITY_INSPECTION_MANAGE');
    expect(action).toContain('PERMISSIONS.QUALITY_RELEASE_DECIDE');
    expect(action).toContain('recordQualityInspection(');
    expect(action).toContain('decideQualityRelease(');
    expect(action).not.toContain(".from('quality_");
  });

  it.each([
    'src/app/(admin)/qa/page.tsx',
    'src/app/(admin)/qa/[id]/page.tsx',
    'src/app/(admin)/qa/create/page.tsx',
  ])('usa consultas tipadas en %s', (path) => {
    const page = source(path);
    expect(page).toContain('createTypedClient(');
    expect(page).not.toContain('createClient(');
    expect(page).not.toContain(': any');
  });
});
