'use server';

import crypto from 'crypto';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

function generateOrderNumber() {
  const date =
    new Date();

  const yyyy =
    date.getFullYear();

  const mm = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const dd = String(
    date.getDate(),
  ).padStart(2, '0');

  const random =
    crypto
      .randomUUID()
      .slice(0, 6)
      .toUpperCase();

  return `SO-${yyyy}${mm}${dd}-${random}`;
}

export async function createSalesOrder(
  formData: FormData,
) {
  const supabase =
    await createClient();

  const customer_id =
    String(
      formData.get(
        'customer_id',
      ),
    );

  const delivery_date =
    formData.get(
      'delivery_date',
    ) || null;

  const notes =
    formData.get('notes') ||
    null;

  const { error } =
    await supabase
      .from(
        'sales_orders',
      )
      .insert({
        order_number:
          generateOrderNumber(),

        customer_id,

        status: 'draft',

        delivery_date,

        notes,

        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/sales-orders',
  );

  redirect(
    '/sales-orders',
  );
}
