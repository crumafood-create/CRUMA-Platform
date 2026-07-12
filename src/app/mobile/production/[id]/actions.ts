'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import {
  consumeProductionItem,
} from '@/modules/production/application/production-service';

import {
  getSuggestedRawMaterialLot,
} from '@/modules/production/application/production-lot';

// ============================================================================
// TYPES
// ============================================================================

export type SuggestedLot = {
  id: string;
  lot_number: string;
  quantity: number;
  expiration_date: string | null;
  location_name: string;
} | null;

export type ProductionDetailItem = {
  id: string;
  raw_material_id: string;
  planned_quantity: number;
  consumed_quantity: number;
  status: string;

  raw_material: {
    id: string;
    name: string;
  } | null;

  suggested_lot: SuggestedLot;
};

export type ProductionDetail = {
  order: {
    id: string;
    order_number: string;
    recipe_id: string;
    recipe_name: string;
    planned_quantity: number;
    produced_quantity: number;
    status: string;
  };

  items: ProductionDetailItem[];
};

// ============================================================================
// CONFIRM ITEM
// ============================================================================

export async function confirmProductionItem(
  productionItemId: string,
  scannedLotNumber: string,
) {
  const supabase =
    await createClient();

  await consumeProductionItem(
    supabase,
    productionItemId,
    scannedLotNumber,
  );

  //
  // Obtener orden para revalidar
  //
  const {
    data: item,
    error,
  } = await supabase
    .from(
      'production_order_items',
    )
    .select(
      'production_order_id',
    )
    .eq(
      'id',
      productionItemId,
    )
    .single();

  if (error || !item) {
    throw new Error(
      error?.message ??
        'Item no encontrado.',
    );
  }

  revalidatePath(
    '/mobile/production',
  );

  revalidatePath(
    `/mobile/production/${item.production_order_id}`,
  );

  revalidatePath(
    '/production-orders',
  );

  revalidatePath(
    `/production-orders/${item.production_order_id}`,
  );

  revalidatePath(
    '/inventory',
  );

  revalidatePath(
    '/inventory-stock',
  );
}

// ============================================================================
// GET DETAIL
// ============================================================================

export async function getProductionDetail(
  productionOrderId: string,
): Promise<ProductionDetail> {
  const supabase =
    await createClient();

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from('production_orders')
    .select(`
      id,
      order_number,
      recipe_id,
      planned_quantity,
      produced_quantity,
      status,

      recipes(
        name
      )
    `)
    .eq(
      'id',
      productionOrderId,
    )
    .single();

  if (
    orderError ||
    !order
  ) {
    throw new Error(
      orderError?.message ??
        'Orden no encontrada.',
    );
  }

  const recipe =
    Array.isArray(
      order.recipes,
    )
      ? order.recipes[0]
      : order.recipes;

  const {
    data: rows,
    error: rowsError,
  } = await supabase
    .from(
      'production_order_items',
    )
    .select(`
      id,
      raw_material_id,
      planned_quantity,
      consumed_quantity,
      status,

      raw_materials(
        id,
        name
      )
    `)
    .eq(
      'production_order_id',
      productionOrderId,
    )
    .order(
      'created_at',
      {
        ascending: true,
      },
    );

  if (rowsError) {
    throw new Error(
      rowsError.message,
    );
  }

  const items:
    ProductionDetailItem[] =
    [];

  for (const row of rows ??
    []) {
    const material =
      Array.isArray(
        row.raw_materials,
      )
        ? row.raw_materials[0]
        : row.raw_materials;

    const suggestedLot =
      await getSuggestedRawMaterialLot(
        supabase,
        row.raw_material_id,
      );

    items.push({
      id: row.id,

      raw_material_id:
        row.raw_material_id,

      planned_quantity:
        Number(
          row.planned_quantity ??
            0,
        ),

      consumed_quantity:
        Number(
          row.consumed_quantity ??
            0,
        ),

      status:
        row.status,

      raw_material:
        material ?? null,

      suggested_lot:
        suggestedLot,
    });
  }

  return {
    order: {
      id: order.id,

      order_number:
        order.order_number,

      recipe_id:
        order.recipe_id,

      recipe_name:
        recipe?.name ??
        '-',

      planned_quantity:
        Number(
          order.planned_quantity,
        ),

      produced_quantity:
        Number(
          order.produced_quantity ??
            0,
        ),

      status:
        order.status,
    },

    items,
  };
}
