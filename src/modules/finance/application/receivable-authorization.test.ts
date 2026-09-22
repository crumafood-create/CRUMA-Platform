import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AuthorizationActor } from '@/modules/identity/guards/auth.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { hasPermission } from '@/modules/identity/permissions/permissions.service';

const action = readFileSync(resolve(process.cwd(), 'src/app/(admin)/accounts-receivable/[id]/payments/actions.ts'), 'utf8');
const actor = (role: 'admin' | 'customer'): AuthorizationActor => ({
  userId: '90000000-0000-0000-0000-000000000001', roles: [role], authorizationSource: 'legacy_user_roles',
});

describe('autorización de cobranza', () => {
  it('reserva finance.receivable.manage para administradores', () => {
    expect(PERMISSIONS.FINANCE_RECEIVABLE_MANAGE).toBe('finance.receivable.manage');
    expect(hasPermission(actor('admin'), PERMISSIONS.FINANCE_RECEIVABLE_MANAGE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.FINANCE_RECEIVABLE_MANAGE)).toBe(false);
  });

  it('autoriza antes de invocar la única escritura transaccional', () => {
    expect(action).toContain('requireTypedAuthorizedAction(');
    expect(action).toContain('PERMISSIONS.FINANCE_RECEIVABLE_MANAGE');
    expect(action.indexOf('registerReceivablePayment(')).toBeGreaterThan(action.indexOf('requireTypedAuthorizedAction('));
    expect(action).not.toContain(".from('accounts_receivable_payments')");
  });
});
