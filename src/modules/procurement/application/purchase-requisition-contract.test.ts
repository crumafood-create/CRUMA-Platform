import { describe, expect, it } from 'vitest';

import {
  assertApprovalDecision,
  assertPurchaseRequisitionStatus,
  assertPurchaseRequisitionTransition,
  type PurchaseRequisitionStatus,
} from './purchase-requisition-contract';

describe('contrato de requisiciones y aprobaciones', () => {
  it.each([
    'draft', 'pending_approval', 'approved', 'rejected', 'converted', 'cancelled',
  ])('acepta el estado %s', (status) => {
    expect(assertPurchaseRequisitionStatus(status)).toBe(status);
  });

  it.each<[PurchaseRequisitionStatus, PurchaseRequisitionStatus]>([
    ['draft', 'pending_approval'],
    ['draft', 'cancelled'],
    ['pending_approval', 'approved'],
    ['pending_approval', 'rejected'],
    ['approved', 'converted'],
    ['approved', 'cancelled'],
  ])('permite la transición %s → %s', (from, to) => {
    expect(assertPurchaseRequisitionTransition(from, to)).toBe(to);
  });

  it.each<[PurchaseRequisitionStatus, PurchaseRequisitionStatus]>([
    ['draft', 'approved'],
    ['pending_approval', 'converted'],
    ['rejected', 'draft'],
    ['converted', 'approved'],
    ['cancelled', 'draft'],
  ])('rechaza la transición %s → %s', (from, to) => {
    expect(() => assertPurchaseRequisitionTransition(from, to)).toThrow(
      'Transición de requisición inválida.',
    );
  });

  it('limita las decisiones a aprobar o rechazar', () => {
    expect(assertApprovalDecision('approved')).toBe('approved');
    expect(assertApprovalDecision('rejected')).toBe('rejected');
    expect(() => assertApprovalDecision('pending')).toThrow(
      'Decisión de aprobación inválida.',
    );
  });

  it('rechaza estados desconocidos', () => {
    expect(() => assertPurchaseRequisitionStatus('released')).toThrow(
      'Estado de requisición fuera del contrato.',
    );
  });
});
