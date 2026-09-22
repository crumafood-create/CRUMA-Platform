import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/modules/identity/guards/auth.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { hasPermission } from '@/modules/identity/permissions/permissions.service';

const source = () => readFileSync(
  resolve(process.cwd(), 'src/app/(admin)/invoices/actions.ts'), 'utf8',
);
const actor = (role: 'admin' | 'customer'): AuthorizationActor => ({
  userId: '90000000-0000-0000-0000-000000000001',
  roles: [role],
  authorizationSource: 'legacy_user_roles',
});

describe('autorización de facturación', () => {
  it('reserva finance.invoice.manage para administradores', () => {
    expect(PERMISSIONS.FINANCE_INVOICE_MANAGE).toBe('finance.invoice.manage');
    expect(hasPermission(actor('admin'), PERMISSIONS.FINANCE_INVOICE_MANAGE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.FINANCE_INVOICE_MANAGE)).toBe(false);
  });

  it('autoriza antes de emitir o cancelar y no escribe tablas directamente', () => {
    const action = source();
    expect(action).toContain('requireTypedAuthorizedAction(');
    expect(action).toContain('PERMISSIONS.FINANCE_INVOICE_MANAGE');
    expect(action.indexOf('issueCommercialInvoice('))
      .toBeGreaterThan(action.indexOf('requireTypedAuthorizedAction('));
    expect(action).toContain('cancelCommercialInvoice(');
    expect(action).not.toContain(".from('sales_invoices')");
    expect(action).not.toContain(".from('sales_invoice_items')");
  });
});
