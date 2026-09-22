'use server';

import { revalidatePath } from 'next/cache';
import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { buildReceivablePayment } from '@/modules/finance/application/receivable-payment-contract';
import { registerReceivablePayment } from '@/modules/finance/application/receivable-payment-repository';

export async function createAccountsReceivablePayment(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.FINANCE_RECEIVABLE_MANAGE);
  const today = new Date().toISOString().slice(0, 10);
  const payment = buildReceivablePayment(formData, today);
  await registerReceivablePayment(supabase, payment);
  revalidatePath('/accounts-receivable');
  revalidatePath(`/accounts-receivable/${payment.accountId}`);
  revalidatePath(`/accounts-receivable/${payment.accountId}/payments`);
}
