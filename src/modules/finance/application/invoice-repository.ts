import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import type { InvoiceIssueRequest } from './invoice-contract';

export async function issueCommercialInvoice(
  supabase: TypedSupabaseClient,
  request: InvoiceIssueRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc('issue_sales_invoice', {
    p_sales_order_id: request.salesOrderId,
    ...(request.dueDate ? { p_due_date: request.dueDate } : {}),
    ...(request.notes ? { p_notes: request.notes } : {}),
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('La emisión no devolvió un identificador.');
  return data;
}

export async function cancelCommercialInvoice(
  supabase: TypedSupabaseClient,
  invoiceId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.rpc('cancel_sales_invoice', {
    p_invoice_id: invoiceId,
    p_reason: reason.trim(),
  });
  if (error) throw new Error(error.message);
}
