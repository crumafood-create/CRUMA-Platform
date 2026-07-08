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
