import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  collectInventoryAlertIds,
  resolveInventoryAlerts,
  type InventoryAlert,
  type InventoryAlertMaterial,
  type InventoryAlertProduct,
} from './inventory-alert-contract';

async function fetchAlertProducts(
  supabase: TypedSupabaseClient,
  ids: readonly string[],
): Promise<InventoryAlertProduct[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, name, internal_code, min_stock')
    .in('id', ids);

  if (error) throw new Error(error.message);

  return data ?? [];
}

async function fetchAlertMaterials(
  supabase: TypedSupabaseClient,
  ids: readonly string[],
): Promise<InventoryAlertMaterial[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('raw_materials')
    .select('id, name, internal_code, minimum_stock')
    .in('id', ids);

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function fetchInventoryAlerts(
  supabase: TypedSupabaseClient,
): Promise<InventoryAlert[]> {
  const { data, error } = await supabase
    .from('inventory_stock_by_item')
    .select('item_type, item_id, quantity');

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const { productIds, materialIds } = collectInventoryAlertIds(rows);

  const [products, materials] = await Promise.all([
    fetchAlertProducts(supabase, productIds),
    fetchAlertMaterials(supabase, materialIds),
  ]);

  return resolveInventoryAlerts(rows, products, materials);
}
