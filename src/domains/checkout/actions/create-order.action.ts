'use server';

import 'server-only';

import { redirect }
from 'next/navigation';

import { createClient }
from '@/infrastructure/supabase/server';

export async function createOrderAction(
  formData: FormData
) {

  const supabase = await createClient();

  const {

    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const orderData = {

    user_id: user.id,

    full_name:
      formData.get('fullName'),

    phone:
      formData.get('phone'),

    address:
      formData.get('address'),

    city:
      formData.get('city'),

    state:
      formData.get('state'),

    postal_code:
      formData.get('postalCode'),

    status: 'pending',

    payment_status: 'pending'
  };

  const { data, error } = await supabase

    .from('orders')

    .insert(orderData)

    .select()

    .single();

  if (error) {

    throw error;
  }

  redirect(
    `/pedido/${data.id}`
  );
}
