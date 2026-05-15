'use server';

import { revalidatePath }
from 'next/cache';

import { createClient }
from '@/infrastructure/supabase/server';

export async function approvePaymentAction(
  orderId: string
) {

  const supabase = await createClient();

  await supabase

    .from('orders')

    .update({

      payment_status: 'paid',

      status: 'confirmed'
    })

    .eq('id', orderId);

  revalidatePath(
    `/admin/pedidos/${orderId}`
  );
}
