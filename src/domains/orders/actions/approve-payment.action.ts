'use server';

import { revalidatePath }
from 'next/cache';

import { createClient }
from '@/infrastructure/supabase/server';

import { logger }
from '@/lib/logger';

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
  logger.info(
  'Payment approved',
  {
    orderId
  }
);
  .eq('id', orderId);
}
