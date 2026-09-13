import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import type { ReceivablePayment } from './receivable-payment-contract';

export async function registerReceivablePayment(
  supabase: TypedSupabaseClient,
  payment: ReceivablePayment,
): Promise<string> {
  const { data, error } = await supabase.rpc('register_receivable_payment', {
    p_account_id: payment.accountId,
    p_payment_date: payment.paymentDate,
    p_amount: payment.amount,
    p_payment_method: payment.paymentMethod,
    p_reference: payment.reference,
    ...(payment.notes ? { p_notes: payment.notes } : {}),
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('El pago no devolvió un identificador.');
  return data;
}
