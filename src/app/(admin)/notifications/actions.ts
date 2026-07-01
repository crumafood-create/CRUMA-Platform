'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function markNotificationAsRead(
  notificationId: string,
) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from(
        'notifications',
      )
      .update({
  read: true,
  updated_at:
    new Date().toISOString(),
      })
      .eq(
        'id',
        notificationId,
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/notifications',
  );

  revalidatePath(
    '/dashboard',
  );
}

export async function generateSystemNotifications() {
  const supabase =
    await createClient();

  //
  // Limpiar notificaciones no leídas
  //
  await supabase
    .from('notifications')
    .delete()
    .eq('read', false);

  //
  // INVENTARIO CRÍTICO
  //
  const {
    data: stock,
  } = await supabase
    .from(
      'inventory_stock_by_item',
    )
    .select(`
      item_id,
      item_type,
      quantity
    `)
    .lte(
      'quantity',
      0,
    );

  for (const row of
    stock ?? []) {
    await supabase
      .from(
        'notifications',
      )
      .insert({
        type:
          'inventory',

        title:
          'Inventario agotado',

        message:
          `${row.item_type} ${row.item_id} no tiene stock.`,

        severity:
          'danger',

        read: false,

        metadata: {
          item_id:
            row.item_id,
          item_type:
            row.item_type,
        },
      });
  }

  //
  // FORECAST
  //
  const {
    data:
      forecasts,
  } = await supabase
    .from(
      'demand_forecasts',
    )
    .select(`
      product_id,
      suggested_production
    `)
    .gt(
      'suggested_production',
      0,
    );

  for (const row of
    forecasts ??
    []) {
    await supabase
      .from(
        'notifications',
      )
      .insert({
        type:
          'forecast',

        title:
          'Producción requerida',

        message:
          `Producto ${row.product_id} requiere producir ${row.suggested_production}.`,

        severity:
          'warning',

        read: false,

        metadata: {
          product_id:
            row.product_id,
        },
      });
  }

  //
  // COMPRAS PENDIENTES
  //
  const {
    data:
      purchases,
  } = await supabase
    .from(
      'purchase_orders',
    )
    .select(`
      id,
      order_number,
      status
    `)
    .in(
      'status',
      [
        'released',
        'partial',
      ],
    );

  for (const row of
    purchases ??
    []) {
    await supabase
      .from(
        'notifications',
      )
      .insert({
        type:
          'purchase',

        title:
          'Compra pendiente',

        message:
          `${row.order_number} aún tiene recepción pendiente.`,

        severity:
          'warning',

        read: false,

        metadata: {
          purchase_order_id:
            row.id,
        },
      });
  }

  //
  // CUENTAS POR COBRAR
  //
  const {
    data:
      receivables,
  } = await supabase
    .from(
      'accounts_receivable',
    )
    .select(`
      id,
      balance,
      status
    `)
    .eq(
      'status',
      'pending',
    );

  for (const row of
    receivables ??
    []) {
    await supabase
      .from(
        'notifications',
      )
      .insert({
        type:
          'receivable',

        title:
          'Cuenta por cobrar',

        message:
          `Existe un saldo pendiente de $${Number(row.balance).toFixed(2)}.`,

        severity:
          'danger',

        read: false,

        metadata: {
          receivable_id:
            row.id,
        },
      });
  }

  revalidatePath(
    '/notifications',
  );

  revalidatePath(
    '/dashboard',
  );
}
