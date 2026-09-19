import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';
import { requireRows } from '@/lib/database/query-result';

import {
  collectInventoryAlertIds,
  rankInventoryAlerts,
  resolveInventoryAlerts,
  type InventoryAlertMaterial,
  type InventoryAlertProduct,
  type InventoryAlertStock,
} from './inventory-alert-contract';

export type InventoryStockItem = {
  itemType: 'product' | 'raw_material';
  itemId: string;
  name: string;
  internalCode: string | null;
  quantity: number;
  minimum: number;
  severity: 'out' | 'critical' | null;
  shortage: number;
};

export type InventoryStockView = {
  items: InventoryStockItem[];
  summary: { references: number; critical: number; outOfStock: number };
};

type InventoryCatalogItem = {
  id: string;
  name: string;
  internal_code: string | null;
  minimum: number;
};

export async function loadInventoryStockView(
  client: TypedSupabaseClient,
): Promise<InventoryStockView> {
  const stock = requireRows(
    await client.from('inventory_stock_by_item').select('item_type, item_id, quantity'),
    'existencias',
  );
  const { productIds, materialIds } = collectInventoryAlertIds(stock);
  const [productsResult, materialsResult] = await Promise.all([
    productIds.length
      ? client.from('products').select('id, name, internal_code, min_stock').in('id', productIds)
      : Promise.resolve({ data: [], error: null }),
    materialIds.length
      ? client.from('raw_materials').select('id, name, internal_code, minimum_stock').in('id', materialIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const products = requireRows(productsResult, 'catálogo de existencias') as InventoryAlertProduct[];
  const materials = requireRows(materialsResult, 'catálogo de existencias') as InventoryAlertMaterial[];
  const alerts = rankInventoryAlerts(resolveInventoryAlerts(stock, products, materials));
  const alertMap = new Map(alerts.map((alert) => [`${alert.item_type}:${alert.item_id}`, alert]));
  const catalog = new Map<string, InventoryCatalogItem>([
    ...products.map((item): [string, InventoryCatalogItem] => [
      item.id,
      { ...item, minimum: item.min_stock ?? 0 },
    ]),
    ...materials.map((item): [string, InventoryCatalogItem] => [
      item.id,
      { ...item, minimum: item.minimum_stock ?? 0 },
    ]),
  ]);
  const items = (stock as InventoryAlertStock[]).flatMap((row): InventoryStockItem[] => {
    if (!row.item_id || (row.item_type !== 'product' && row.item_type !== 'raw_material')) return [];
    const item = catalog.get(row.item_id);
    if (!item) return [];
    const alert = alertMap.get(`${row.item_type}:${row.item_id}`);
    return [{
      itemType: row.item_type,
      itemId: row.item_id,
      name: item.name,
      internalCode: item.internal_code,
      quantity: row.quantity ?? 0,
      minimum: item.minimum,
      severity: alert?.severity ?? null,
      shortage: alert?.shortage ?? 0,
    }];
  }).sort((left, right) => {
    if (left.severity !== right.severity) {
      if (left.severity === 'out') return -1;
      if (right.severity === 'out') return 1;
      if (left.severity === 'critical') return -1;
      if (right.severity === 'critical') return 1;
    }
    return left.quantity - right.quantity;
  });

  return {
    items,
    summary: {
      references: items.length,
      critical: alerts.length,
      outOfStock: alerts.filter((alert) => alert.severity === 'out').length,
    },
  };
}
