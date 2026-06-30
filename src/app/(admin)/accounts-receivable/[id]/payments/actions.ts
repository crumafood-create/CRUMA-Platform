'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createAccountsReceivablePayment(
  formData: FormData,
) {
  const supabase =
    await createClient();

  const accountId =
    String(
      formData.get(
        'account_receivable_id',
      ),
    );

  const amount =
    Number(
      formData.get(
        'amount',
      ),
    );

  const payment_date =
    formData.get(
      'payment_date',
    );

  const payment_method =
    formData.get(
      'payment_method',
    );

  const reference =
    formData.get(
      'reference',
    );

  const notes =
    formData.get('notes');

  const {
    data: account,
  } = await supabase
    .from(
      'accounts_receivable',
    )
    .select('*')
    .eq(
      'id',
      accountId,
    )
    .single();

  if (!account) {
    throw new Error(
      'Cuenta no encontrada',
    );
  }

  await supabase
    .from(
      'accounts_receivable_payments',
    )
    .insert({
      account_receivable_id:
        accountId,

      payment_date,

      amount,

      payment_method,

      reference,

      notes,
    });

  const paid =
    Number(
      account.paid_amount,
    ) + amount;

  const balance =
    Number(account.amount) -
    paid;

  let status =
    'pending';

  if (balance <= 0) {
    status = 'paid';
  } else if (
    paid > 0
  ) {
    status =
      'partial';
  }

  await supabase
    .from(
      'accounts_receivable',
    )
    .update({
      paid_amount:
        paid,

      balance,

      status,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      accountId,
    );

  revalidatePath(
    '/accounts-receivable',
  );

  revalidatePath(
    `/accounts-receivable/${accountId}`,
  );

  revalidatePath(
    `/accounts-receivable/${accountId}/payments`,
  );
}
