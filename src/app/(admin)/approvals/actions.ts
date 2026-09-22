'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { assertApprovalDecision } from '@/modules/procurement/application/purchase-requisition-contract';
import {
  createPurchaseApprovals as createPurchaseApprovalRecords,
  decideApproval as persistApprovalDecision,
} from '@/modules/procurement/application/purchase-requisition-repository';

function refresh(): void {
  revalidatePath('/approvals');
  revalidatePath('/purchase-requisitions');
  revalidatePath('/purchase-orders');
  revalidatePath('/production-orders');
}

export async function decideApproval(
  approvalId: string,
  decisionValue: string,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.APPROVAL_DECIDE);
  const decision = assertApprovalDecision(decisionValue);
  await persistApprovalDecision(supabase, approvalId, decision);
  refresh();
}

export async function createPurchaseApprovals(): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.APPROVAL_DECIDE);
  await createPurchaseApprovalRecords(supabase);
  refresh();
}
