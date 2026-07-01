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

export async function confirmSalesOrder(
  orderId: string,
) {
  const supabase =
    await createClient();

  //
  // Pedido
  //
  const {
    data: order,
    error: orderError,
  } = await supabase
    .from('sales_orders')
    .select(`
      id,
      status
    `)
    .eq('id', orderId)
    .single();

  if (
    orderError ||
    !order
  ) {
    throw new Error(
      orderError?.message ??
        'Pedido no encontrado',
    );
  }

  if (
    order.status !==
    'draft'
  ) {
    throw new Error(
      'Solo se pueden confirmar pedidos en borrador.',
    );
  }

  //
  // Renglones
  //
  const {
    data: items,
    error: itemsError,
  } = await supabase
    .from(
      'sales_order_items',
    )
    .select(`
      product_id,
      quantity
    `)
    .eq(
      'sales_order_id',
      orderId,
    );

  if (
    itemsError
  ) {
    throw new Error(
      itemsError.message,
    );
  }

  if (
    !items?.length
  ) {
    throw new Error(
      'El pedido no tiene productos.',
    );
  }

  //
  // ATP
  //
  const productIds =
    items.map(
      (
        item,
      ) =>
        item.product_id,
    );

  const {
    data: atp,
    error: atpError,
  } = await supabase
    .from(
      'inventory_available_to_promise',
    )
    .select(`
      item_id,
      available_quantity
    `)
    .eq(
      'item_type',
      'product',
    )
    .in(
      'item_id',
      productIds,
    );

  if (
    atpError
  ) {
    throw new Error(
      atpError.message,
    );
  }

  const atpMap =
    new Map(
      (
        atp ??
        []
      ).map(
        (
          row,
        ) => [
          row.item_id,
          Number(
            row.available_quantity,
          ),
        ],
      ),
    );

  //
  // Validar ATP
  //
  for (const item of items) {
    const available =
      atpMap.get(
        item.product_id,
      ) ?? 0;

    const required =
      Number(
        item.quantity,
      );

    if (
      available <
      required
    ) {
      throw new Error(
        `Stock insuficiente para producto ${item.product_id}. Disponible ${available}. Requerido ${required}.`,
      );
    }
  }

  //
  // Crear reservas
  //
  const reservations =
    items.map(
      (
        item,
      ) => ({
        item_type:
          'product',

        item_id:
          item.product_id,

        reference_type:
          'sales_order',

        reference_id:
          orderId,

        quantity:
          item.quantity,

        status:
          'active',

        notes:
          'Reserva por pedido de venta',
      }),
    );

  const {
    error:
      reservationError,
  } = await supabase
    .from(
      'inventory_reservations',
    )
    .insert(
      reservations,
    );

  if (
    reservationError
  ) {
    throw new Error(
      reservationError.message,
    );
  }

  //
  // Confirmar pedido
  //
  const {
    error:
      updateError,
  } = await supabase
    .from(
      'sales_orders',
    )
    .update({
      status:
        'confirmed',

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      orderId,
    );

  if (
    updateError
  ) {
    throw new Error(
      updateError.message,
    );
  }

  revalidatePath(
    '/sales-orders',
  );

  revalidatePath(
    `/sales-orders/${orderId}`,
  );

  revalidatePath(
    '/inventory-atp',
  );
}

export async function startPreparingSalesOrder(
  orderId: string,
) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from('sales_orders')
      .update({
        status:
          'preparing',
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', orderId);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/sales-orders',
  );

  revalidatePath(
    `/sales-orders/${orderId}`,
  );
}

export async function markSalesOrderReady(
  orderId: string,
) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from('sales_orders')
      .update({
        status: 'ready',
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', orderId);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/sales-orders',
  );

  revalidatePath(
    `/sales-orders/${orderId}`,
  );
}

export async function deliverSalesOrder(
  orderId: string,
) {
  const supabase =
    await createClient();

  const { data: order } =
    await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId)
      .single();

  if (!order) {
    throw new Error(
      'Pedido no encontrado',
    );
  }

  const { data: items } =
    await supabase
      .from(
        'sales_order_items',
      )
      .select('*')
      .eq(
        'sales_order_id',
        orderId,
      );

  for (const item of items ?? []) {
    await supabase
      .from(
        'inventory_movements',
      )
      .insert({
        item_type:
          'product',

        item_id:
          item.product_id,

        movement_type:
          'exit',

        quantity:
          item.quantity,

        reference_type:
          'sales_order',

        reference_id:
          orderId,

        notes:
          'Entrega de pedido',
      });
  }

  await supabase
    .from(
      'accounts_receivable',
    )
    .insert({
      customer_id:
        order.customer_id,

      sales_order_id:
        order.id,

      document_number:
        order.order_number,

      amount:
        order.total,

      balance:
        order.total,

      due_date:
        order.delivery_date,

      status:
        'pending',
    });

  const { error } =
    await supabase
      .from('sales_orders')
      .update({
        status:
          'delivered',

        updated_at:
          new Date().toISOString(),
      })
      .eq('id', orderId);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/sales-orders',
  );

  revalidatePath(
    `/sales-orders/${orderId}`,
  );

  revalidatePath(
    '/inventory-stock',
  );

  revalidatePath(
    '/inventory',
  );

  revalidatePath(
    '/accounts-receivable',
  );
}
