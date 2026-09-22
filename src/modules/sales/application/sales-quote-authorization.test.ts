import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/modules/identity/guards/auth.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { hasPermission } from '@/modules/identity/permissions/permissions.service';

const action = () => readFileSync(resolve(process.cwd(), 'src/app/(admin)/sales-quotes/actions.ts'), 'utf8');
const actor = (role: 'admin' | 'customer'): AuthorizationActor => ({
  userId: '90000000-0000-0000-0000-000000000001', roles: [role], authorizationSource: 'legacy_user_roles',
});

describe('autorización de cotizaciones', () => {
  it('reserva sales.quote.manage para administradores', () => {
    expect(PERMISSIONS.SALES_QUOTE_MANAGE).toBe('sales.quote.manage');
    expect(hasPermission(actor('admin'), PERMISSIONS.SALES_QUOTE_MANAGE)).toBe(true);
    expect(hasPermission(actor('customer'), PERMISSIONS.SALES_QUOTE_MANAGE)).toBe(false);
  });

  it('autoriza antes de toda escritura y no muta tablas directamente', () => {
    const source = action();
    expect(source).toContain('requireTypedAuthorizedAction(PERMISSIONS.SALES_QUOTE_MANAGE)');
    expect(source).toContain('createSalesQuote(');
    expect(source).toContain('addSalesQuoteItem(');
    expect(source).toContain('transitionSalesQuote(');
    expect(source).toContain('convertSalesQuoteToOrder(');
    expect(source).not.toContain(".from('sales_quotes')");
    expect(source).not.toContain(".from('sales_quote_items')");
  });
});
