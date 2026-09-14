export type SalesQuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'converted';
export interface SalesQuoteCreateRequest { customerId: string; validUntil: string; notes: string | null; terms: string | null }
export interface SalesQuoteItemRequest { quoteId: string; productId: string; quantity: number; unitPrice: number; discount: number; taxRate: number; subtotal: number; taxAmount: number; total: number }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRANSITIONS: Record<SalesQuoteStatus, readonly SalesQuoteStatus[]> = {
  draft: ['sent', 'cancelled', 'expired'], sent: ['accepted', 'rejected', 'cancelled', 'expired'],
  accepted: ['cancelled', 'converted'], rejected: [], expired: [], cancelled: [], converted: [],
};
const text = (form: FormData, field: string) => form.get(field)?.toString().trim() ?? '';
const round = (value: number) => Number(value.toFixed(2));
function validDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.valueOf())
    && date.toISOString().slice(0, 10) === value;
}

export function buildSalesQuoteCreateRequest(form: FormData, today: string): SalesQuoteCreateRequest {
  const customerId = text(form, 'customer_id');
  const validUntil = text(form, 'valid_until');
  if (!UUID.test(customerId)) throw new Error('Identificador de cliente inválido.');
  if (!validDate(validUntil)) throw new Error('Vigencia inválida.');
  if (validUntil < today) throw new Error('La vigencia no puede ser anterior a la emisión.');
  return { customerId, validUntil, notes: text(form, 'notes') || null, terms: text(form, 'terms') || null };
}

export function buildSalesQuoteItemRequest(form: FormData): SalesQuoteItemRequest {
  const quoteId = text(form, 'quote_id'); const productId = text(form, 'product_id');
  const quantity = Number(text(form, 'quantity')); const unitPrice = Number(text(form, 'unit_price'));
  const discount = Number(text(form, 'discount') || '0'); const taxRate = Number(text(form, 'tax_rate') || '0');
  if (!UUID.test(quoteId)) throw new Error('Identificador de cotización inválido.');
  if (!UUID.test(productId)) throw new Error('Identificador de producto inválido.');
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Cantidad inválida.');
  if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error('Precio inválido.');
  const subtotal = round(quantity * unitPrice);
  if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) throw new Error('Descuento inválido.');
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) throw new Error('Impuesto inválido.');
  const taxAmount = round((subtotal - discount) * taxRate / 100);
  return { quoteId, productId, quantity, unitPrice, discount, taxRate, subtotal,
    taxAmount, total: round(subtotal - discount + taxAmount) };
}

export function assertSalesQuoteTransition(from: SalesQuoteStatus, to: SalesQuoteStatus): SalesQuoteStatus {
  if (!TRANSITIONS[from].includes(to)) throw new Error('Transición de cotización inválida.');
  return to;
}
