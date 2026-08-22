import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  groupProductionItemStatuses,
  normalizeMobileProductionItem,
  normalizeMobileProductionOrder,
  normalizeMobileProductionSummary,
  uniqueProductionIds,
  type MobileProductionDetail,
  type MobileProductionItemSelection,
  type MobileProductionOrderSummary,
  type MobileRawMaterial,
} from './mobile-production-contract';

const MOBILE_ORDER_COLUMNS =
  'id, production_number, recipe_id, planned_quantity, produced_quantity, production_status, created_at';

async function loadRecipeNames(
  supabase: TypedSupabaseClient,
  recipeIds: readonly string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();

  if (recipeIds.length === 0) return names;

  const { data, error } = await supabase
    .from('recipes')
    .select('id, name')
    .in('id', uniqueProductionIds(recipeIds));

  if (error) throw new Error(error.message);

  for (const recipe of data ?? []) {
    names.set(recipe.id, recipe.name);
  }

  return names;
}

async function loadRawMaterials(
  supabase: TypedSupabaseClient,
  materialIds: readonly string[],
): Promise<Map<string, MobileRawMaterial>> {
  const materials = new Map<string, MobileRawMaterial>();

  if (materialIds.length === 0) return materials;

  const { data, error } = await supabase
    .from('raw_materials')
    .select('id, name')
    .in('id', uniqueProductionIds(materialIds));

  if (error) throw new Error(error.message);

  for (const material of data ?? []) {
    materials.set(material.id, material);
  }

  return materials;
}

async function loadOrderItemStatuses(
  supabase: TypedSupabaseClient,
  orderIds: readonly string[],
) {
  if (orderIds.length === 0) return groupProductionItemStatuses([]);

  const { data, error } = await supabase
    .from('production_order_items')
    .select('production_order_id, status')
    .in('production_order_id', uniqueProductionIds(orderIds));

  if (error) throw new Error(error.message);

  return groupProductionItemStatuses(data ?? []);
}

async function loadOrderItems(
  supabase: TypedSupabaseClient,
  orderId: string,
): Promise<MobileProductionItemSelection[]> {
  const { data, error } = await supabase
    .from('production_order_items')
    .select('id, raw_material_id, planned_quantity, consumed_quantity, status')
    .eq('production_order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function fetchMobileProductionOrders(
  supabase: TypedSupabaseClient,
): Promise<MobileProductionOrderSummary[]> {
  const { data, error } = await supabase
    .from('production_orders')
    .select(MOBILE_ORDER_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const orders = data ?? [];

  if (orders.length === 0) return [];

  const [recipes, items] = await Promise.all([
    loadRecipeNames(supabase, orders.map((order) => order.recipe_id)),
    loadOrderItemStatuses(supabase, orders.map((order) => order.id)),
  ]);

  return orders.map((order) =>
    normalizeMobileProductionSummary(
      order,
      recipes.get(order.recipe_id),
      items.get(order.id) ?? [],
    ),
  );
}

export async function fetchMobileProductionDetail(
  supabase: TypedSupabaseClient,
  orderId: string,
): Promise<MobileProductionDetail> {
  const { data: order, error } = await supabase
    .from('production_orders')
    .select(MOBILE_ORDER_COLUMNS)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(error?.message ?? 'Orden de producción no encontrada.');
  }

  const [recipes, rows] = await Promise.all([
    loadRecipeNames(supabase, [order.recipe_id]),
    loadOrderItems(supabase, orderId),
  ]);

  const materials = await loadRawMaterials(
    supabase,
    rows.map((row) => row.raw_material_id),
  );

  return {
    order: normalizeMobileProductionOrder(order, recipes.get(order.recipe_id)),
    items: rows.map((row) =>
      normalizeMobileProductionItem(row, materials.get(row.raw_material_id)),
    ),
  };
}
