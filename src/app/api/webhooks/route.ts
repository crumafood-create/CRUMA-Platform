import { createClient } from '@/infrastructure/supabase/server';
import { client } from '@/infrastructure/payments/mercadopago';
import { Payment } from 'mercadopago';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  
  // 1. Obtener los parámetros de búsqueda de la URL (Mercado Pago envía el ID ahí)
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('data.id');

  // Solo nos interesan las notificaciones de pago
  if (type !== 'payment' || !id) {
    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  }

  try {
    // 2. Consultar el estado REAL del pago directamente en Mercado Pago
    // Nunca confíes solo en lo que llega en el cuerpo del POST por seguridad
    const payment = await new Payment(client).get({ id });

    if (payment.status === 'approved') {
      const { user_id, role } = payment.metadata;

      // 3. Lógica de Negocio: Actualizar Pedido en Supabase
      // Aquí registramos la transacción para tu contabilidad RESICO
      const { error } = await supabase
        .from('orders')
        .insert({
          user_id,
          payment_id: id,
          amount: payment.transaction_amount,
          status: 'paid',
          items: payment.additional_info?.items,
          metadata: {
            role,
            installments: payment.installments,
            payment_method: payment.payment_method_id
          }
        });

      if (error) throw error;

      // 4. Lógica de Inventario
      // Aquí podrías disparar un trigger para descontar masa/insumos
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('MP Webhook Error:', error);
    return NextResponse.json({ message: 'Webhook Error' }, { status: 500 });
  }
}
