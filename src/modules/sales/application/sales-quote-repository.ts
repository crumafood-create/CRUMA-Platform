import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import type { SalesQuoteCreateRequest, SalesQuoteItemRequest, SalesQuoteStatus } from './sales-quote-contract';

const resultId = (data: string | null, error: { message: string } | null, fallback: string): string => {
  if (error) throw new Error(error.message); if (!data) throw new Error(fallback); return data;
};
export async function createSalesQuote(client: TypedSupabaseClient, input: SalesQuoteCreateRequest): Promise<string> {
  const { data, error } = await client.rpc('create_sales_quote', { p_customer_id: input.customerId,
    p_valid_until: input.validUntil, ...(input.notes ? { p_notes: input.notes } : {}), ...(input.terms ? { p_terms: input.terms } : {}) });
  return resultId(data, error, 'La cotización no devolvió un identificador.');
}
export async function addSalesQuoteItem(client: TypedSupabaseClient, input: SalesQuoteItemRequest): Promise<string> {
  const { data, error } = await client.rpc('add_sales_quote_item', { p_quote_id: input.quoteId,
    p_product_id: input.productId, p_quantity: input.quantity, p_unit_price: input.unitPrice,
    p_discount: input.discount, p_tax_rate: input.taxRate });
  return resultId(data, error, 'La partida no devolvió un identificador.');
}
export async function transitionSalesQuote(client: TypedSupabaseClient, id: string, from: SalesQuoteStatus, to: SalesQuoteStatus): Promise<void> {
  const { error } = await client.rpc('transition_sales_quote', { p_quote_id: id, p_expected_status: from, p_next_status: to });
  if (error) throw new Error(error.message);
}
export async function convertSalesQuoteToOrder(client: TypedSupabaseClient, id: string): Promise<string> {
  const { data, error } = await client.rpc('convert_sales_quote_to_order', { p_quote_id: id });
  return resultId(data, error, 'La conversión no devolvió un pedido.');
}
