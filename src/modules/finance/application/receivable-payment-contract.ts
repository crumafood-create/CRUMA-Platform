export const PAYMENT_METHODS = ['cash', 'transfer', 'card', 'mercado_pago', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface ReceivablePayment {
  accountId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  notes: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (form: FormData, field: string) => form.get(field)?.toString().trim() ?? '';

function validDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function buildReceivablePayment(form: FormData, today: string): ReceivablePayment {
  const accountId = text(form, 'account_receivable_id');
  const paymentDate = text(form, 'payment_date');
  const amount = Number(text(form, 'amount'));
  const paymentMethod = text(form, 'payment_method');
  const reference = text(form, 'reference');
  if (!UUID.test(accountId)) throw new Error('Identificador de cuenta inválido.');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('El monto del pago debe ser mayor que cero.');
  if (!validDate(paymentDate)) throw new Error('Fecha de pago inválida.');
  if (paymentDate > today) throw new Error('La fecha de pago no puede estar en el futuro.');
  if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) throw new Error('Método de pago inválido.');
  if (!reference) throw new Error('La referencia del pago es obligatoria.');
  return { accountId, paymentDate, amount, paymentMethod: paymentMethod as PaymentMethod,
    reference, notes: text(form, 'notes') || null };
}
