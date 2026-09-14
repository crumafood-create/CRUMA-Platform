export type PurchaseRequisitionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'converted'
  | 'cancelled';

export type ApprovalDecision = 'approved' | 'rejected';

const TRANSITIONS: Record<PurchaseRequisitionStatus, readonly PurchaseRequisitionStatus[]> = {
  draft: ['pending_approval', 'cancelled'],
  pending_approval: ['approved', 'rejected'],
  approved: ['converted', 'cancelled'],
  rejected: [],
  converted: [],
  cancelled: [],
};

export function assertPurchaseRequisitionStatus(value: unknown): PurchaseRequisitionStatus {
  if (typeof value !== 'string' || !(value in TRANSITIONS)) {
    throw new Error('Estado de requisición fuera del contrato.');
  }
  return value as PurchaseRequisitionStatus;
}

export function assertPurchaseRequisitionTransition(
  from: PurchaseRequisitionStatus,
  to: PurchaseRequisitionStatus,
): PurchaseRequisitionStatus {
  if (!TRANSITIONS[from].includes(to)) {
    throw new Error('Transición de requisición inválida.');
  }
  return to;
}

export function assertApprovalDecision(value: unknown): ApprovalDecision {
  if (value !== 'approved' && value !== 'rejected') {
    throw new Error('Decisión de aprobación inválida.');
  }
  return value;
}
