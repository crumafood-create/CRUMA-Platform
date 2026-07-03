'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function confirmPicking(
  pickingItemId: string,
  lotNumber: string,
) {
  const supabase =
    await createClient();

  //
  // Item de picking
  //
  const {
    data: item,
    error: itemError,
  } = await supabase
    .from(
      'picking_order_items',
    )
    .select(`
      id,
      picking_order_id,
      product_id,
      quantity,
      picked_quantity,
      product_lot_id
    `)
    .eq(
      'id',
      pickingItemId,
    )
    .single();

  if (
    itemError ||
    !item
  ) {
    throw new Error(
      'Item de picking no encontrado.',
    );
  }

  //
  // Buscar lote
  //
  const {
    data: lot,
    error: lotError,
  } = await supabase
    .from('product_lots')
    .select(`
      id,
      lot_number,
      product_id,
      quantity
    `)
    .eq(
      'lot_number',
      lotNumber,
    )
    .single();

  if (
    lotError ||
    !lot
  ) {
    throw new Error(
      'Lote no encontrado.',
    );
  }

  //
  // Validar producto
  //
  if (
    lot.product_id !==
    item.product_id
  ) {
    throw new Error(
      'El lote pertenece a otro producto.',
    );
  }

  const required =
    Number(
      item.quantity,
    );

  const available =
    Number(
      lot.quantity,
    );

  if (
    available <
    required
  ) {
    throw new Error(
      `El lote solo tiene ${available} unidades disponibles.`,
    );
  }

  //
  // Marcar item como pickeado
  //
  const {
    error:
      updateItemError,
  } = await supabase
    .from(
      'picking_order_items',
    )
    .update({
      picked_quantity:
        required,

      product_lot_id:
        lot.id,

      status:
        'completed',

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      pickingItemId,
    );

  if (
    updateItemError
  ) {
    throw new Error(
      updateItemError.message,
    );
  }

  //
  // Revisar si todo el picking terminó
  //
  const {
    data: items,
    error:
      itemsError,
  } = await supabase
    .from(
      'picking_order_items',
    )
    .select(`
      id,
      status
    `)
    .eq(
      'picking_order_id',
      item.picking_order_id,
    );

  if (
    itemsError
  ) {
    throw new Error(
      itemsError.message,
    );
  }

  const completed =
    (
      items ??
      []
    ).every(
      (
        row,
      ) =>
        row.status ===
        'completed',
    );

  //
  // Finalizar picking
  //
  if (completed) {
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
          item.picking_order_id,
        )
        .single();

    await supabase
      .from(
        'picking_orders',
      )
      .update({
        status:
          'completed',

        completed_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        item.picking_order_id,
      );

    if (
      picking?.sales_order_id
    ) {
      await supabase
        .from(
          'sales_orders',
        )
        .update({
          status:
            'preparing',

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

  revalidatePath(
    '/sales-orders',
  );
}
