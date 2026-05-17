'use server';

import 'server-only';

import { redirect }
from 'next/navigation';

import { randomUUID }
from 'crypto';

import { createClient }
from '@/infrastructure/supabase/server';

export async function uploadPaymentProofAction(
  formData: FormData
) {

  const supabase = await createClient();

  const orderId =
    formData.get('orderId') as string;

  const file =
    formData.get('file') as File;

  if (!file) {

    throw new Error(
      'Archivo requerido'
    );
  }

  const fileExt =
    file.name.split('.').pop();

  const fileName =
    `${randomUUID()}.${fileExt}`;

  const path =
    `${orderId}/${fileName}`;

  const { error: uploadError } =
    await supabase.storage

      .from('payment-proofs')

      .upload(path, file, {

        contentType: file.type
      });

  if (uploadError) {

    throw uploadError;
  }

  const { error: dbError } =
    await supabase

      .from('payment_proofs')

      .insert({

        order_id: orderId,

        file_path: path,

        status: 'pending'
      });

  if (dbError) {

    throw dbError;
  }

  await supabase

    .from('orders')

    .update({

      payment_status:
        'proof_uploaded'
    })

    .eq('id', orderId);

  redirect(
    `/pedido/${orderId}`
  );
}
