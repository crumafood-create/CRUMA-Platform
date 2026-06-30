'use server';

import crypto from 'crypto';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

function generateOrderNumber() {
  const date = new Date();

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

  return `PO-${yyyy}${mm}${dd}-${random}`;
}

export async function createPurchaseOrder(
  formData: FormData,
) {
  const supabase =
    await createClient();

  const supplier_id =
    String(
      formData.get(
        'supplier_id',
      ),
    );

  const expected_date =
    formData.get(
      'expected_date',
    ) || null;

  const notes =
    formData.get('notes') ||
    null;

  const { error } =
    await supabase
      .from(
        'purchase_orders',
      )
      .insert({
        order_number:
          generateOrderNumber(),

        supplier_id,

        status: 'draft',

        expected_date,

        notes,

        subtotal: 0,
        total: 0,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/purchase-orders',
  );

  redirect(
    '/purchase-orders',
  );
}
