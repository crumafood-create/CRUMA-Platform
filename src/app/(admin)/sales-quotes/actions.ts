'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { assertSalesQuoteTransition, buildSalesQuoteCreateRequest, buildSalesQuoteItemRequest, type SalesQuoteStatus } from '@/modules/sales/application/sales-quote-contract';
import { addSalesQuoteItem, convertSalesQuoteToOrder, createSalesQuote, transitionSalesQuote } from '@/modules/sales/application/sales-quote-repository';

const refresh = (id: string) => { revalidatePath('/sales-quotes'); revalidatePath(`/sales-quotes/${id}`); };
export async function createQuote(formData: FormData): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_QUOTE_MANAGE);
  const input = buildSalesQuoteCreateRequest(formData, new Date().toISOString().slice(0, 10));
  const id = await createSalesQuote(supabase, input); redirect(`/sales-quotes/${id}`);
}
export async function addQuoteItem(formData: FormData): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_QUOTE_MANAGE);
  const input = buildSalesQuoteItemRequest(formData); await addSalesQuoteItem(supabase, input); refresh(input.quoteId);
}
export async function transitionQuote(id: string, from: SalesQuoteStatus, to: SalesQuoteStatus): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_QUOTE_MANAGE);
  assertSalesQuoteTransition(from, to); await transitionSalesQuote(supabase, id, from, to); refresh(id);
}
export async function convertQuote(id: string): Promise<void> {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_QUOTE_MANAGE);
  const orderId = await convertSalesQuoteToOrder(supabase, id); refresh(id); revalidatePath('/sales-orders'); redirect(`/sales-orders/${orderId}`);
}
