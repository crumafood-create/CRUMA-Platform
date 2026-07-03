'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function pickItem(
  itemId: string,
) {
  const supabase =
    await createClient();

  const {
    data: item,
    error,
  } = await supabase
    .from(
      'picking_order_items',
    )
    .select('*')
    .eq(
      'id',
      itemId,
    )
    .single();

  if (
    error ||
    !item
  ) {
    throw new Error(
      'Item no encontrado',
    );
  }

  const quantity =
    Number(
      item.quantity,
    );

  const {
    error:
      updateError,
  } = await supabase
    .from(
      'picking_order_items',
    )
    .update({
      picked_quantity:
        quantity,

      status:
        'completed',

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      itemId,
    );

  if (
    updateError
  ) {
    throw new Error(
      updateError.message,
    );
  }

  const {
    data: items,
  } = await supabase
    .from(
      'picking_order_items',
    )
    .select(`
      status,
      picking_order_id
    `)
    .eq(
      'picking_order_id',
      item.picking_order_id,
    );

  const completed =
    (items ?? []).every(
      (
        row,
      ) =>
        row.status ===
        'completed',
    );

  if (
    completed &&
    items?.length
  ) {
    const pickingId =
      items[0]
        .picking_order_id;

    const {
      data: picking,
    } =
      await supabase
        .from(
          'picking_orders',
        )
        .select(`
          sales_order_id
        `)
        .eq(
          'id',
          pickingId,
        )
        .single();

    await supabase
      .from(
        'picking_orders',
      )
      .update({
        status:
          'completed',

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        pickingId,
      );

    if (
      picking
        ?.sales_order_id
    ) {
      await supabase
        .from(
          'sales_orders',
        )
        .update({
          status:
            'ready',

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          picking.sales_order_id,
        );
    }
  }

  revalidatePath(
    '/mobile/picking',
  );

  revalidatePath(
    `/mobile/picking/${item.picking_order_id}`,
  );
}
