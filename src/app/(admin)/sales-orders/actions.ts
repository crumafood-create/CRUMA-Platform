'use server';

import crypto from 'crypto';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { requireAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';

type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

interface SalesOrderRow {
  id: string;
  order_number: string;
  customer_id: string;
  status: SalesOrderStatus;
  total: number | null;
}

interface SalesOrderItemRow {
  id: string;
  sales_order_id: string;
  product_id: string;
  quantity: number | null;
  delivered_quantity: number | null;
}

interface ATPRow {
  item_id: string;
  available_quantity: number | null;
}

interface PickingOrderRow {
  id: string;
  sales_order_id: string;
}

function generateOrderNumber() {
  const date = new Date();

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  const random = crypto.randomUUID().slice(0, 6).toUpperCase();

  return `SO-${yyyy}${mm}${dd}-${random}`;
}

export async function createSalesOrder(formData: FormData) {
  const { supabase } = await requireAuthorizedAction(
    PERMISSIONS.SALES_ORDER_CREATE,
  );

  const customer_id =
    formData.get('customer_id')?.toString().trim() ?? '';

  const delivery_date =
    formData.get('delivery_date')?.toString() || null;

  const notes =
    formData.get('notes')?.toString().trim() || null;

  if (!customer_id) {
    throw new Error('Cliente requerido');
  }

  const { error } = await supabase.from('sales_orders').insert({
    order_number: generateOrderNumber(),
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
    throw new Error(error.message);
  }

  revalidatePath('/sales-orders');
  redirect('/sales-orders');
}

export async function confirmSalesOrder(orderId: string) {
  const { supabase } = await requireAuthorizedAction(
    PERMISSIONS.SALES_ORDER_CONFIRM,
  );

  //
  // Pedido
  //
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(`
      id,
      status
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? 'Pedido no encontrado');
  }

  const typedOrder = order as Pick<SalesOrderRow, 'id' | 'status'>;

  if (typedOrder.status !== 'draft') {
    throw new Error('Solo se pueden confirmar pedidos en borrador.');
  }

  //
  // Renglones
  //
  const { data: items, error: itemsError } = await supabase
    .from('sales_order_items')
    .select(`
      id,
      product_id,
      quantity
    `)
    .eq('sales_order_id', orderId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const typedItems = (items ?? []) as Array<
    Pick<SalesOrderItemRow, 'id' | 'product_id' | 'quantity'>
  >;

  if (typedItems.length === 0) {
    throw new Error('El pedido no tiene productos.');
  }

  //
  // ATP
  //
  const productIds = typedItems.map((item) => item.product_id);

  const { data: atp, error: atpError } = await supabase
    .from('inventory_available_to_promise')
    .select(`
      item_id,
      available_quantity
    `)
    .eq('item_type', 'product')
    .in('item_id', productIds);

  if (atpError) {
    throw new Error(atpError.message);
  }

  const typedAtp = (atp ?? []) as ATPRow[];

  const atpMap = new Map(
    typedAtp.map((row) => [
      row.item_id,
      Number(row.available_quantity ?? 0),
    ]),
  );

  //
  // Validar ATP
  //
  for (const item of typedItems) {
    const available = atpMap.get(item.product_id) ?? 0;
    const required = Number(item.quantity ?? 0);

    if (available < required) {
      throw new Error(
        `Stock insuficiente para producto ${item.product_id}. Disponible ${available}. Requerido ${required}.`,
      );
    }
  }

  //
  // Crear reservas
  //
  const reservations = typedItems.map((item) => ({
    item_type: 'product' as const,
    item_id: item.product_id,
    reference_type: 'sales_order',
    reference_id: orderId,
    quantity: Number(item.quantity ?? 0),
    status: 'active',
    notes: 'Reserva por pedido de venta',
  }));

  const { error: insertReservationError } = await supabase
    .from('inventory_reservations')
    .insert(reservations);

  if (insertReservationError) {
    throw new Error(insertReservationError.message);
  }

  //
  // Crear picking
  //
  const { data: picking, error: pickingError } = await supabase
    .from('picking_orders')
    .insert({
      sales_order_id: orderId,
      status: 'pending',
    })
    .select('id, sales_order_id')
    .single();

  if (pickingError || !picking) {
    throw new Error(
      pickingError?.message ?? 'No se pudo crear el picking.',
    );
  }

  const typedPicking = picking as PickingOrderRow;

  const pickingItems = [];

for (const item of items) {
  const {
    data: lot,
  } = await supabase
    .from(
      'inventory_pick_suggestions',
    )
    .select(`
      lot_id,
      product_id,
      lot_number,
      quantity,
      location_name
    `)
    .eq(
      'product_id',
      item.product_id,
    )
    .limit(1)
    .maybeSingle();

  pickingItems.push({
    picking_order_id:
      picking.id,

    product_id:
      item.product_id,

    quantity:
      Number(
        item.quantity,
      ),

    suggested_lot_id:
      lot?.lot_id ?? null,

    suggested_lot_number:
      lot?.lot_number ??
      null,

    suggested_location:
      lot?.location_name ??
      null,
  });
    }

  const { error: pickingItemsError } = await supabase
    .from('picking_order_items')
    .insert(pickingItems);

  if (pickingItemsError) {
    throw new Error(pickingItemsError.message);
  }

  //
  // Confirmar pedido
  //
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath('/sales-orders');
  revalidatePath(`/sales-orders/${orderId}`);
  revalidatePath('/inventory-atp');
  revalidatePath('/mobile/picking');
  revalidatePath(`/mobile/picking/${typedPicking.id}`);
}

export async function startPreparingSalesOrder(orderId: string) {
  const { supabase } = await requireAuthorizedAction(
    PERMISSIONS.SALES_ORDER_PREPARE,
  );

  const { error } = await supabase
    .from('sales_orders')
    .update({
      status: 'preparing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/sales-orders');
  revalidatePath(`/sales-orders/${orderId}`);
}

export async function markSalesOrderReady(orderId: string) {
  const { supabase } = await requireAuthorizedAction(
    PERMISSIONS.SALES_ORDER_PREPARE,
  );

  const { error } = await supabase
    .from('sales_orders')
    .update({
      status: 'ready',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/sales-orders');
  revalidatePath(`/sales-orders/${orderId}`);
}

export async function deliverSalesOrder(orderId: string) {
  const { supabase } = await requireAuthorizedAction(
    PERMISSIONS.SALES_ORDER_DELIVER,
  );

  //
  // Pedido
  //
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(`
      id,
      total,
      customer_id,
      status
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? 'Pedido no encontrado');
  }

  const typedOrder = order as Pick<
    SalesOrderRow,
    'id' | 'total' | 'customer_id' | 'status'
  >;

  if (
    typedOrder.status !== 'confirmed' &&
    typedOrder.status !== 'ready'
  ) {
    throw new Error('Solo se pueden entregar pedidos confirmados o listos.');
  }

  //
  // Productos
  //
  const { data: items, error: itemsError } = await supabase
    .from('sales_order_items')
    .select(`
      product_id,
      quantity
    `)
    .eq('sales_order_id', orderId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const typedItems = (items ?? []) as Array<
    Pick<SalesOrderItemRow, 'product_id' | 'quantity'>
  >;

  //
  // Salidas de inventario
  //
  const movements = typedItems.map((item) => ({
    item_type: 'product' as const,
    item_id: item.product_id,
    movement_type: 'exit' as const,
    quantity: Number(item.quantity ?? 0),
    reference_type: 'sales_order',
    reference_id: orderId,
    notes: 'Entrega de pedido',
  }));

  if (movements.length > 0) {
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert(movements);

    for (const item of typedItems) {
  const { data: pickingItem } = await supabase
    .from('picking_order_items')
    .select(`
      quantity,
      product_lot_id
    `)
    .eq('product_id', item.product_id)
    .limit(1)
    .maybeSingle();

  if (
    pickingItem?.product_lot_id &&
    pickingItem.quantity
  ) {
    await supabase.rpc(
      'decrease_product_lot_quantity',
      {
        p_lot_id:
          pickingItem.product_lot_id,
        p_quantity:
          Number(
            pickingItem.quantity,
          ),
      },
    );
  }
    }

    if (movementError) {
      throw new Error(movementError.message);
    }
  }

  //
  // Liberar reservas
  //
  const { error: releaseReservationError } = await supabase
    .from('inventory_reservations')
    .update({
      status: 'released',
      updated_at: new Date().toISOString(),
    })
    .eq('reference_type', 'sales_order')
    .eq('reference_id', orderId);

  if (releaseReservationError) {
    throw new Error(releaseReservationError.message);
  }

  //
  // Pedido entregado
  //
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  //
  // Cuenta por cobrar
  //
  if (Number(typedOrder.total ?? 0) > 0) {
    const { error: receivableError } = await supabase
      .from('accounts_receivable')
      .insert({
        customer_id: typedOrder.customer_id,
        sales_order_id: orderId,
        amount: typedOrder.total,
        balance: typedOrder.total,
        status: 'pending',
      });

    if (receivableError) {
      throw new Error(receivableError.message);
    }
  }

  revalidatePath('/sales-orders');
  revalidatePath(`/sales-orders/${orderId}`);
  revalidatePath('/inventory-stock');
  revalidatePath('/inventory-atp');
  revalidatePath('/accounts-receivable');
}
