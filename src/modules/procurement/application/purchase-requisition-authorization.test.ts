import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { AuthorizationActor } from '@/modules/identity/guards/auth.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { hasPermission } from '@/modules/identity/permissions/permissions.service';

const requisitionActions = () => readFileSync(resolve(
  process.cwd(), 'src/app/(admin)/purchase-requisitions/actions.ts',
), 'utf8');
const approvalActions = () => readFileSync(resolve(
  process.cwd(), 'src/app/(admin)/approvals/actions.ts',
), 'utf8');
const actor = (role: 'admin' | 'customer'): AuthorizationActor => ({
  userId: 'b1000000-0000-0000-0000-000000000001',
  roles: [role],
  authorizationSource: 'legacy_user_roles',
});

describe('autorización de requisiciones y aprobaciones', () => {
  it.each([
    ['PROCUREMENT_REQUISITION_MANAGE', 'procurement.requisition.manage'],
    ['APPROVAL_DECIDE', 'approval.decide'],
  ] as const)('reserva %s para administradores', (key, value) => {
    expect(PERMISSIONS[key]).toBe(value);
    expect(hasPermission(actor('admin'), value)).toBe(true);
    expect(hasPermission(actor('customer'), value)).toBe(false);
  });

  it('autoriza las mutaciones de requisiciones antes de usar el repositorio', () => {
    const source = requisitionActions();
    expect(source.match(/requireTypedAuthorizedAction\(/g)).toHaveLength(3);
    expect(source).toContain('PERMISSIONS.PROCUREMENT_REQUISITION_MANAGE');
    expect(source).toContain('createPurchaseRequisitionFromMrp(');
    expect(source).toContain('submitPurchaseRequisition(');
    expect(source).toContain('convertPurchaseRequisitionToOrders(');
    expect(source).not.toContain(".from('purchase_requisitions')");
    expect(source).not.toContain(".from('purchase_requisition_items')");
  });

  it('autoriza decisiones y creación de sugerencias antes de escribir', () => {
    const source = approvalActions();
    expect(source).toContain('requireTypedAuthorizedAction(PERMISSIONS.APPROVAL_DECIDE)');
    expect(source).toContain('decideApproval(');
    expect(source).toContain('createPurchaseApprovals(');
    expect(source).not.toContain(".from('approvals')");
  });

  it.each([
    'src/app/(admin)/purchase-requisitions/page.tsx',
    'src/app/(admin)/purchase-requisitions/[id]/page.tsx',
    'src/app/(admin)/approvals/page.tsx',
  ])('usa cliente tipado y elimina any en %s', (path) => {
    const source = readFileSync(resolve(process.cwd(), path), 'utf8');
    expect(source).toContain('createTypedClient(');
    expect(source).not.toContain('createClient(');
    expect(source).not.toContain(': any');
  });
});
