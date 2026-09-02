import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/lib/auth/guards/auth.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { hasPermission } from '@/lib/auth/permissions/permissions.service';

const ACTIONS = '../../../app/(admin)/suppliers/actions.ts';

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

describe('autorización de proveedores', () => {
  it('define un permiso específico de compras', () => {
    expect(PERMISSIONS.PROCUREMENT_SUPPLIER_MANAGE).toBe('procurement.supplier.manage');
  });

  it('autoriza administradores y bloquea clientes', () => {
    expect(hasPermission(actor('admin'), PERMISSIONS.PROCUREMENT_SUPPLIER_MANAGE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.PROCUREMENT_SUPPLIER_MANAGE)).toBe(false);
  });

  it.each(['createSupplier', 'updateSupplier', 'deleteSupplier'])(
    'protege %s antes de escribir',
    (action) => {
      const body = actionSource(action);
      expect(body.indexOf('requireTypedAuthorizedAction(')).toBeGreaterThanOrEqual(0);
      expect(body).toContain('PERMISSIONS.PROCUREMENT_SUPPLIER_MANAGE');
      expect(body.indexOf(".from('suppliers')")).toBeGreaterThan(
        body.indexOf('requireTypedAuthorizedAction('),
      );
    },
  );

  it.each(['updateSupplier', 'deleteSupplier'])(
    'comprueba asociaciones antes de desactivar en %s',
    (action) => {
      const body = actionSource(action);
      expect(body.indexOf('assertSupplierCanBeDeactivated(')).toBeGreaterThanOrEqual(0);
      expect(body.indexOf(".from('suppliers')")).toBeGreaterThan(
        body.indexOf('assertSupplierCanBeDeactivated('),
      );
    },
  );

  it.each([
    '../../../app/(admin)/suppliers/page.tsx',
    '../../../app/(admin)/suppliers/[id]/edit/page.tsx',
  ])('usa el cliente tipado y elimina any en %s', (path) => {
    expect(source(path)).toContain('createTypedClient(');
    expect(source(path)).not.toContain('createClient(');
    expect(source(path)).not.toContain(': any');
  });
});
