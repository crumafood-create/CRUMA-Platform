'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

// ============================================================================
// TYPES
// ============================================================================

export type SuggestedLocation = {
  id: string;
  name: string;
} | null;

export type ReceivingItem = {
  id: string;
  purchase_order_id: string;

  raw_material_id: string;

  quantity: number;

  received_quantity: number;

  unit_cost: number;

  raw_material: {
    id: string;
    name: string;
  } | null;

  suggested_location: SuggestedLocation;
};

export type ReceivingDetail = {
  purchaseOrder: {
    id: string;

    order_number: string;

    supplier_id: string;

    status: string;
  };

  items: ReceivingItem[];
};

// ============================================================================
// GET RECEIVING DETAIL
// ============================================================================

export async function getReceivingDetail(
  purchaseOrderId: string,
): Promise<ReceivingDetail> {
  const supabase =
    await createClient();

  //
  // Orden
  //
  const {
    data: purchaseOrder,
    error: purchaseOrderError,
  } = await supabase
    .from('purchase_orders')
    .select(`
      id,
      order_number,
      supplier_id,
      status
    `)
    .eq('id', purchaseOrderId)
    .single();

  if (
    purchaseOrderError ||
    !purchaseOrder
  ) {
    throw new Error(
      'Orden de compra no encontrada.',
    );
  }

  //
  // Partidas
  //
  const {
    data: items,
    error: itemsError,
  } = await supabase
    .from('purchase_order_items')
    .select(`
      id,
      purchase_order_id,
      raw_material_id,
      quantity,
      received_quantity,
      unit_cost,

      raw_material:raw_materials(
        id,
        name
      )
    `)
    .eq(
      'purchase_order_id',
      purchaseOrderId,
    )
    .order('id');

  if (itemsError) {
    throw new Error(
      itemsError.message,
    );
  }

  return {
    purchaseOrder,

    items:
      (items ?? []).map(
        (item: any) => ({
          id: item.id,

          purchase_order_id:
            item.purchase_order_id,

          raw_material_id:
            item.raw_material_id,

          quantity: Number(
            item.quantity,
          ),

          received_quantity:
            Number(
              item.received_quantity ??
                0,
            ),

          unit_cost: Number(
            item.unit_cost ?? 0,
          ),

          raw_material:
            item.raw_material,

          suggested_location:
            null,
        }),
      ),
  };
}

// ============================================================================
// CONFIRM RECEIVING
// ============================================================================

export async function confirmReceiving(
  purchaseOrderItemId: string,
  lotNumber: string,
  expirationDate: string,
  inventoryLocationId: string,
) {
  const supabase =
    await createClient();

  //
  // Item
  //
  const {
    data: item,
    error: itemError,
  } = await supabase
    .from('purchase_order_items')
    .select(`
      *,
      purchase_orders(
        id,
        order_number,
        status
      )
    `)
    .eq('id', purchaseOrderItemId)
    .single();

  if (itemError || !item) {
    throw new Error(
      'Partida no encontrada.',
    );
  }

  const quantity =
    Number(item.quantity);

  //
  // Crear lote
  //
  const {
    data: lot,
    error: lotError,
  } = await supabase
    .from('raw_material_lots')
    .insert({
      raw_material_id:
        item.raw_material_id,

      lot_number:
        lotNumber.trim(),

      expiration_date:
        expirationDate,

      quantity:
        quantity,

      inventory_location_id:
        inventoryLocationId,

      status:
        'available',

      unit_cost:
        item.unit_cost,
    })
    .select()
    .single();

  if (lotError || !lot) {
    throw new Error(
      lotError?.message ??
        'No fue posible crear el lote.',
    );
  }

  //
  // Movimiento inventario
  //
  const {
    error: movementError,
  } = await supabase
    .from(
      'inventory_movements',
    )
    .insert({
      warehouse_id: null,

      product_id: null,

      variant_id: null,

      movement_type: 'IN',

      quantity: quantity,

      previous_stock: 0,

      new_stock: quantity,

      reference_type:
        'purchase_order',

      reference_id:
        item.purchase_order_id,

      item_type:
        'raw_material',

      item_id:
        item.raw_material_id,

      notes:
        `Recepción OC ${item.purchase_orders.order_number}`,
    });

  if (movementError) {
    throw new Error(
      movementError.message,
    );
  }

  //
  // Actualizar partida
  //
  const {
    error: updateItemError,
  } = await supabase
    .from(
      'purchase_order_items',
    )
    .update({
      received_quantity:
        quantity,
    })
    .eq(
      'id',
      purchaseOrderItemId,
    );

  if (updateItemError) {
    throw new Error(
      updateItemError.message,
    );
  }

  //
  // Revisar si terminó toda la OC
  //
  const {
    data: rows,
    error: rowsError,
  } = await supabase
    .from(
      'purchase_order_items',
    )
    .select(`
      quantity,
      received_quantity
    `)
    .eq(
      'purchase_order_id',
      item.purchase_order_id,
    );

  if (rowsError) {
    throw new Error(
      rowsError.message,
    );
  }

  const completed =
    (rows ?? []).every(
      (row) =>
        Number(
          row.received_quantity,
        ) >=
        Number(
          row.quantity,
        ),
    );

  //
  // Actualizar OC
  //
  await supabase
    .from(
      'purchase_orders',
    )
    .update({
      status: completed
        ? 'received'
        : 'partial',

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      item.purchase_order_id,
    );

  //
  // Refresh
  //
  revalidatePath(
    '/mobile/receiving',
  );

  revalidatePath(
    `/mobile/receiving/${item.purchase_order_id}`,
  );

  revalidatePath(
    '/purchase-orders',
  );

  revalidatePath(
    `/purchase-orders/${item.purchase_order_id}`,
  );
}
