import type {
  ApplicationDatabase,
  PublicTableRow,
} from '@/infrastructure/integrations/supabase/database.types';

type StockViewRow = ApplicationDatabase['public']['Views']['inventory_stock_by_item']['Row'];

export type InventoryAlertStock = Pick<StockViewRow, 'item_type' | 'item_id' | 'quantity'>;

export type InventoryAlertProduct = Pick<
  PublicTableRow<'products'>,
  'id' | 'name' | 'internal_code' | 'min_stock'
>;

export type InventoryAlertMaterial = Pick<
  PublicTableRow<'raw_materials'>,
  'id' | 'name' | 'internal_code' | 'minimum_stock'
>;

export type InventoryAlert = {
  item_type: 'product' | 'raw_material';
  item_id: string;
  quantity: number;
  name: string;
  internal_code: string | null;
  minimum: number;
};

export function collectInventoryAlertIds(rows: readonly InventoryAlertStock[]) {
  const productIds = new Set<string>();
  const materialIds = new Set<string>();

  for (const row of rows) {
    if (!row.item_id) continue;
    if (row.item_type === 'product') productIds.add(row.item_id);
    if (row.item_type === 'raw_material') materialIds.add(row.item_id);
  }

  return { productIds: [...productIds], materialIds: [...materialIds] };
}

export function resolveInventoryAlerts(
  rows: readonly InventoryAlertStock[],
  products: readonly InventoryAlertProduct[],
  materials: readonly InventoryAlertMaterial[],
): InventoryAlert[] {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const materialMap = new Map(materials.map((material) => [material.id, material]));

  return rows.flatMap((row) => {
    if (!row.item_id) return [];
    if (row.item_type !== 'product' && row.item_type !== 'raw_material') return [];

    const item = row.item_type === 'product'
      ? productMap.get(row.item_id)
      : materialMap.get(row.item_id);

    if (!item) return [];

    const minimum = row.item_type === 'product'
      ? productMap.get(row.item_id)?.min_stock ?? 0
      : materialMap.get(row.item_id)?.minimum_stock ?? 0;
    const quantity = row.quantity ?? 0;

    if (quantity > minimum) return [];

    return [{
      item_type: row.item_type,
      item_id: row.item_id,
      quantity,
      name: item.name,
      internal_code: item.internal_code,
      minimum,
    }];
  });
}
