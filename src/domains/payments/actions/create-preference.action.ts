'use server'

import { client } from '@/infrastructure/payments/mercadopago';
import { Preference } from 'mercadopago';
import { createClient } from '@/infrastructure/supabase/server';

export async function createPaymentPreference(cartItems: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Debes iniciar sesión para comprar");

  // Obtener rol para asegurar el precio correcto (Senior Security Check)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  // Mapear items a formato Mercado Pago
  const items = cartItems.map(item => ({
    id: item.id,
    title: item.name,
    unit_price: Number(item.price),
    quantity: Number(item.quantity),
    currency_id: 'MXN'
  }));

  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items,
      payer: { email: profile?.email || user.email },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/pedidos/exito`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/error`,
      },
      auto_return: 'approved',
      metadata: { 
        user_id: user.id,
        role: profile?.role // Importante para analíticas B2B vs B2C
      }
    }
  });

  return { id: result.id, init_point: result.init_point };
}
