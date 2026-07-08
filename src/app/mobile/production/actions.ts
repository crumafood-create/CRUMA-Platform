'use server';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export type ProductionOrderStatus =
  | 'draft'
  | 'released'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type RecipeRelation =
  | {
      id: string;
      name: string;
    }
  | {
      id: string;
      name: string;
    }[]
  | null;

type ProductionItemsRelation =
  | {
      id: string;
      status: string | null;
    }[]
  | null;

type RawMaterialRelation =
  | {
      id: string;
      name: string;
    }
  | {
      id: string;
      name: string;
    }[]
  | null;

export type ProductionOrderSummary = {
  id: string;
  order_number: string;
  recipe_id: string;
  recipe_name: string;
  planned_quantity: number;
  produced_quantity: number;
  status: ProductionOrderStatus;
  created_at: string;
  total_items: number;
  completed_items: number;
};

export type ProductionOrderDetailItem = {
  id: string;
  raw_material_id: string;
  planned_quantity: number;
  consumed_quantity: number;
  status: string;
  raw_material: {
    id: string;
    name: string;
  } | null;
};

export type ProductionOrderDetail = {
  order: {
    id: string;
    order_number: string;
    recipe_id: string;
    recipe_name: string;
    planned_quantity: number;
    produced_quantity: number;
    status: ProductionOrderStatus;
    created_at: string;
  };
  items: ProductionOrderDetailItem[];
};

function unwrapSingle<T>(
  value: T | T[] | null | undefined,
): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getProductionOrders(): Promise<
  ProductionOrderSummary[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('production_orders')
    .select(`
      id,
      order_number,
      recipe_id,
      planned_quantity,
      produced_quantity,
      status,
      created_at,
      recipes (
        id,
        name
      ),
      production_order_items (
        id,
        status
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: any) => {
    const recipe = unwrapSingle<{
      id: string;
      name: string;
    }>(row.recipes);

    const items = (row.production_order_items ?? []) as ProductionItemsRelation;

    const totalItems = Array.isArray(items) ? items.length : 0;

    const completedItems = Array.isArray(items)
      ? items.filter((item) => item.status === 'completed').length
      : 0;

    return {
      id: row.id,
      order_number: row.order_number,
      recipe_id: row.recipe_id,
      recipe_name: recipe?.name ?? '-',
      planned_quantity: Number(row.planned_quantity ?? 0),
      produced_quantity: Number(row.produced_quantity ?? 0),
      status: row.status as ProductionOrderStatus,
      created_at: row.created_at,
      total_items: totalItems,
      completed_items: completedItems,
    };
  });
}

export async function getProductionDetail(
  orderId: string,
): Promise<ProductionOrderDetail> {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from('production_orders')
    .select(`
      id,
      order_number,
      recipe_id,
      planned_quantity,
      produced_quantity,
      status,
      created_at,
      recipes (
        id,
        name
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(
      orderError?.message ?? 'Orden de producción no encontrada.',
    );
  }

  const recipe = unwrapSingle<{
    id: string;
    name: string;
  }>(order.recipes as RecipeRelation);

  const { data: items, error: itemsError } = await supabase
    .from('production_order_items')
    .select(`
      id,
      raw_material_id,
      planned_quantity,
      consumed_quantity,
      status,
      raw_materials (
        id,
        name
      )
    `)
    .eq('production_order_id', orderId)
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const normalizedItems: ProductionOrderDetailItem[] = (items ?? []).map(
    (row: any) => {
      const rawMaterial = unwrapSingle<{
        id: string;
        name: string;
      }>(row.raw_materials as RawMaterialRelation);

      return {
        id: row.id,
        raw_material_id: row.raw_material_id,
        planned_quantity: Number(row.planned_quantity ?? 0),
        consumed_quantity: Number(row.consumed_quantity ?? 0),
        status: row.status ?? 'pending',
        raw_material: rawMaterial,
      };
    },
  );

  return {
    order: {
      id: order.id,
      order_number: order.order_number,
      recipe_id: order.recipe_id,
      recipe_name: recipe?.name ?? '-',
      planned_quantity: Number(order.planned_quantity ?? 0),
      produced_quantity: Number(order.produced_quantity ?? 0),
      status: order.status as ProductionOrderStatus,
      created_at: order.created_at,
    },
    items: normalizedItems,
  };
}
