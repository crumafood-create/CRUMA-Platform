'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { buildInvoiceIssueRequest } from '@/modules/finance/application/invoice-contract';
import {
  cancelCommercialInvoice,
  issueCommercialInvoice,
} from '@/modules/finance/application/invoice-repository';

export async function issueInvoice(formData: FormData): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.FINANCE_INVOICE_MANAGE);
  const today = new Date().toISOString().slice(0, 10);
  const request = buildInvoiceIssueRequest(formData, today);
  const invoiceId = await issueCommercialInvoice(supabase, request);
  revalidatePath('/invoices');
  revalidatePath('/accounts-receivable');
  revalidatePath(`/sales-orders/${request.salesOrderId}`);
  redirect(`/invoices/${invoiceId}`);
}

export async function cancelInvoice(invoiceId: string, formData: FormData): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.FINANCE_INVOICE_MANAGE);
  const reason = formData.get('reason')?.toString().trim() ?? '';
  if (!reason) throw new Error('El motivo de cancelación es obligatorio.');
  await cancelCommercialInvoice(supabase, invoiceId, reason);
  revalidatePath('/invoices');
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath('/accounts-receivable');
}
