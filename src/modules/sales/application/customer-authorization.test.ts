import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { AuthorizationActor } from '@/modules/identity/guards/types';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { hasPermission } from '@/modules/identity/permissions/permissions.service';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const actor = (role: 'admin' | 'customer'): AuthorizationActor => ({
  userId: '00000000-0000-0000-0000-000000000001', roles: [role], authorizationSource: 'legacy_user_roles',
});

describe('autorización de clientes', () => {
  it('reserva sales.customer.manage para administradores', () => {
    expect(PERMISSIONS.SALES_CUSTOMER_MANAGE).toBe('sales.customer.manage');
    expect(hasPermission(actor('admin'), PERMISSIONS.SALES_CUSTOMER_MANAGE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.SALES_CUSTOMER_MANAGE)).toBe(false);
  });

  it('protege las tres mutaciones antes de escribir', () => {
    const source = read('../../../app/(admin)/customers/actions.ts');
    expect(source.match(/requireTypedAuthorizedAction\(/g)).toHaveLength(3);
    expect(source.match(/PERMISSIONS\.SALES_CUSTOMER_MANAGE/g)).toHaveLength(3);
  });

it.each([
    '../../../app/(admin)/customers/page.tsx', 
    '../../../app/(admin)/customers/[id]/edit/page.tsx'
  ])('usa cliente tipado sin any en %s', (path) => {
    const source = read(path);
    expect(source).toContain('createTypedClient(');
    expect(source).not.toContain(': any');
  });
});
