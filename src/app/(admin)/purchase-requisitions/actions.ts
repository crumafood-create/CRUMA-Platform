'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import {
  convertPurchaseRequisitionToOrders,
  createPurchaseRequisitionFromMrp,
  submitPurchaseRequisition,
} from '@/modules/procurement/application/purchase-requisition-repository';

function refresh(requisitionId: string): void {
  revalidatePath('/purchase-requisitions');
  revalidatePath(`/purchase-requisitions/${requisitionId}`);
  revalidatePath('/approvals');
}

export async function generatePurchaseRequisition(): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_REQUISITION_MANAGE,
  );
  const id = await createPurchaseRequisitionFromMrp(supabase);
  redirect(`/purchase-requisitions/${id}`);
}

export async function requestPurchaseRequisitionApproval(
  requisitionId: string,
): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_REQUISITION_MANAGE,
  );
  await submitPurchaseRequisition(supabase, requisitionId);
  refresh(requisitionId);
}

export async function convertToPurchaseOrders(requisitionId: string): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_REQUISITION_MANAGE,
  );
  const orderIds = await convertPurchaseRequisitionToOrders(supabase, requisitionId);
  refresh(requisitionId);
  revalidatePath('/purchase-orders');
  redirect(orderIds.length === 1 ? `/purchase-orders/${orderIds[0]}` : '/purchase-orders');
}
