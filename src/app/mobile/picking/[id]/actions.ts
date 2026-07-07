'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { getSuggestedLot, type SuggestedLot } from '../actions';

export type PickingOrderStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PickingOrder = {
  id: string;
  status: PickingOrderStatus;
  sales_order_id: string;
  created_at?: string;
  completed_at: string | null;
};

export type PickingProduct = {
  id: string;
  name: string;
};

export type PickingLot = {
  lot_number: string;
} | null;

export type PickingDetailItem = {
  id: string;
  picking_order_id: string;
  product_id: string;
  quantity: number;
  picked_quantity: number;
  status: string;
  product: PickingProduct | null;
  picked_lot: PickingLot;
  suggested_lot: SuggestedLot;
};

export type PickingDetail = {
  picking: {
    id: string;
    status: string;
    sales_order_id: string;
  };
  items: PickingDetailItem[];
};

export async function confirmPicking(
  pickingItemId: string,
  lotNumber: string,
) {
  const supabase = await createClient();
  const scannedLotNumber = lotNumber.trim();

  const { data: item, error: itemError } = await supabase
    .from('picking_order_items')
    .select(`
      id,
      picking_order_id,
      product_id,
      quantity,
      picked_quantity,
      product_lot_id,
      status
    `)
    .eq('id', pickingItemId)
    .single();

  if (itemError || !item) {
    throw new Error('Item de picking no encontrado.');
  }

  if (item.status === 'completed') {
    throw new Error('Este item ya fue pickeado.');
  }

  const suggestedLot = await getSuggestedLot(item.product_id);

  if (!suggestedLot) {
    throw new Error('No hay lote sugerido para este producto.');
  }

  if (scannedLotNumber !== suggestedLot.lot_number) {
    throw new Error(
      `Lote incorrecto. Esperado: ${suggestedLot.lot_number}, Escaneado: ${scannedLotNumber}`,
    );
  }

  const { data: lot, error: lotError } = await supabase
    .from('product_lots')
    .select(`
      id,
      lot_number,
      product_id,
      quantity
    `)
    .eq('lot_number', scannedLotNumber)
    .maybeSingle();

  if (lotError || !lot) {
    throw new Error('Lote no encontrado.');
  }

  if (lot.product_id !== item.product_id) {
    throw new Error('El lote pertenece a otro producto.');
  }

  const required = Number(item.quantity ?? 0);
  const available = Number(lot.quantity ?? 0);

  if (available < required) {
    throw new Error(`El lote solo tiene ${available} unidades disponibles.`);
  }

  const { error: lotUpdateError } = await supabase
  .from('product_lots')
  .update({
    quantity: available - required,
    updated_at: new Date().toISOString(),
  })
  .eq('id', lot.id);

if (lotUpdateError) {
  throw new Error(lotUpdateError.message);
}

  const { error: movementError } = await supabase
  .from('inventory_movements')
  .insert({
    item_type: 'product',
    item_id: item.product_id,

    movement_type: 'exit',

    quantity: required,

    product_lot_id: lot.id,

    reference_type: 'picking',

    reference_id: item.picking_order_id,

    notes: `Picking ${item.picking_order_id}`,
  });

if (movementError) {
  throw new Error(movementError.message);
}

  await supabase
  .from('inventory_reservations')
  .update({
    status: 'released',
    updated_at: new Date().toISOString(),
  })
  .eq('reference_type', 'sales_order')
  .eq('item_id', item.product_id);
  const { error: updateItemError } = await supabase
    .from('picking_order_items')
    .update({
      picked_quantity: required,
      product_lot_id: lot.id,
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', pickingItemId);

  if (updateItemError) {
    throw new Error(updateItemError.message);
  }

  const { data: items, error: itemsError } = await supabase
    .from('picking_order_items')
    .select(`
      id,
      status
    `)
    .eq('picking_order_id', item.picking_order_id);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const completed = (items ?? []).every(
    (row) => row.status === 'completed',
  );

  const { data: picking, error: pickingError } = await supabase
    .from('picking_orders')
    .select(`
      sales_order_id
    `)
    .eq('id', item.picking_order_id)
    .single();

  if (pickingError || !picking) {
    throw new Error(
      pickingError?.message ?? 'No se encontró la orden de picking.',
    );
  }

  const { error: pickingUpdateError } = await supabase
    .from('picking_orders')
    .update({
      status: completed ? 'completed' : 'in_progress',
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.picking_order_id);

  if (pickingUpdateError) {
    throw new Error(pickingUpdateError.message);
  }

  if (completed && picking.sales_order_id) {
    const { error: salesOrderUpdateError } = await supabase
      .from('sales_orders')
      .update({
        status: 'preparing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', picking.sales_order_id);

    if (salesOrderUpdateError) {
      throw new Error(salesOrderUpdateError.message);
    }
  }

  revalidatePath('/mobile/picking');
  revalidatePath(`/mobile/picking/${item.picking_order_id}`);
  revalidatePath('/sales-orders');
  revalidatePath(`/sales-orders/${picking.sales_order_id}`);
}

export async function getPickingDetail(
  pickingId: string,
): Promise<PickingDetail> {
  const supabase = await createClient();

  const { data: picking, error: pickingError } = await supabase
    .from('picking_orders')
    .select(`
      id,
      status,
      sales_order_id,
      completed_at
    `)
    .eq('id', pickingId)
    .single();

  if (pickingError || !picking) {
    throw new Error('Picking no encontrado.');
  }

  const { data: items, error: itemsError } = await supabase
    .from('picking_order_items')
    .select(`
      id,
      picking_order_id,
      product_id,
      quantity,
      picked_quantity,
      status,
      product_lot_id,
      products (
        id,
        name
      ),
      product_lots (
        id,
        lot_number
      )
    `)
    .eq('picking_order_id', pickingId)
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const normalizedItems: PickingDetailItem[] = await Promise.all(
    (items ?? []).map(async (row: any) => {
      const rawProduct = row.products;
      const product = Array.isArray(rawProduct)
        ? rawProduct[0] ?? null
        : rawProduct ?? null;

      const rawPickedLot = row.product_lots;
      const pickedLot = Array.isArray(rawPickedLot)
        ? rawPickedLot[0] ?? null
        : rawPickedLot ?? null;

      const suggestedLot = product?.id
        ? await getSuggestedLot(product.id)
        : null;

      return {
        id: row.id,
        picking_order_id: row.picking_order_id,
        product_id: row.product_id,
        quantity: Number(row.quantity ?? 0),
        picked_quantity: Number(row.picked_quantity ?? 0),
        status: row.status ?? 'pending',
        product,
        suggested_lot: suggestedLot,
        picked_lot: pickedLot
          ? {
              lot_number: pickedLot.lot_number ?? '',
            }
          : null,
      };
    }),
  );

  return {
    picking: {
      id: picking.id,
      status: picking.status,
      sales_order_id: picking.sales_order_id,
    },
    items: normalizedItems,
  };
}
