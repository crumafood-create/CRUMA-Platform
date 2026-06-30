'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createSalesOrderItem(
  formData: FormData,
) {
  const supabase =
    await createClient();

  const salesOrderId =
    String(
      formData.get(
        'sales_order_id',
      ),
    );

  const productId =
    String(
      formData.get(
        'product_id',
      ),
    );

  const quantity =
    Number(
      formData.get(
        'quantity',
      ),
    );

  const unitPrice =
    Number(
      formData.get(
        'unit_price',
      ),
    );

  const total =
    quantity * unitPrice;

  const { error } =
    await supabase
      .from(
        'sales_order_items',
      )
      .insert({
        sales_order_id:
          salesOrderId,

        product_id:
          productId,

        quantity,

        unit_price:
          unitPrice,

        total,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const {
    data: items,
  } = await supabase
    .from(
      'sales_order_items',
    )
    .select('total')
    .eq(
      'sales_order_id',
      salesOrderId,
    );

  const subtotal =
    (items ?? []).reduce(
      (sum, item) =>
        sum +
        Number(
          item.total,
        ),
      0,
    );

  await supabase
    .from('sales_orders')
    .update({
      subtotal,
      total:
        subtotal,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      salesOrderId,
    );

  revalidatePath(
    `/sales-orders/${salesOrderId}`,
  );

  revalidatePath(
    `/sales-orders/${salesOrderId}/items`,
  );

  revalidatePath(
    '/sales-orders',
  );
}
