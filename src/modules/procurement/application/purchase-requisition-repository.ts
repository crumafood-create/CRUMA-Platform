import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import type { ApprovalDecision } from './purchase-requisition-contract';

function databaseError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function createPurchaseRequisitionFromMrp(
  supabase: TypedSupabaseClient,
): Promise<string> {
  const { data, error } = await supabase.rpc('create_purchase_requisition_from_mrp');
  databaseError(error);
  if (!data) throw new Error('La base de datos no devolvió la requisición.');
  return data;
}

export async function submitPurchaseRequisition(
  supabase: TypedSupabaseClient,
  requisitionId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('submit_purchase_requisition', {
    p_requisition_id: requisitionId,
  });
  databaseError(error);
  if (!data) throw new Error('La base de datos no devolvió la aprobación.');
  return data;
}

export async function decideApproval(
  supabase: TypedSupabaseClient,
  approvalId: string,
  decision: ApprovalDecision,
): Promise<string> {
  const { data, error } = await supabase.rpc('decide_approval', {
    p_approval_id: approvalId,
    p_decision: decision,
  });
  databaseError(error);
  if (!data) throw new Error('La base de datos no confirmó la decisión.');
  return data;
}

export async function convertPurchaseRequisitionToOrders(
  supabase: TypedSupabaseClient,
  requisitionId: string,
): Promise<string[]> {
  const { data, error } = await supabase.rpc('convert_purchase_requisition_to_orders', {
    p_requisition_id: requisitionId,
  });
  databaseError(error);
  if (!data?.length) throw new Error('La base de datos no devolvió órdenes de compra.');
  return data;
}

export async function createPurchaseApprovals(
  supabase: TypedSupabaseClient,
): Promise<number> {
  const { data, error } = await supabase.rpc('create_purchase_approvals');
  databaseError(error);
  return data ?? 0;
}
