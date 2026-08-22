import type { PublicTableRow } from '@/infrastructure/integrations/supabase/database.types';

import type { ProductionStatus } from '../domain/constants';

import { assertProductionStatus } from './production-order-contract';

type ProductionOrderRow = PublicTableRow<'production_orders'>;
type ProductionOrderItemRow = PublicTableRow<'production_order_items'>;
type RawMaterialRow = PublicTableRow<'raw_materials'>;

export type MobileProductionOrderSelection = Pick<
  ProductionOrderRow,
  | 'id'
  | 'production_number'
  | 'recipe_id'
  | 'planned_quantity'
  | 'produced_quantity'
  | 'production_status'
  | 'created_at'
>;

export type MobileProductionOrder = Omit<
  MobileProductionOrderSelection,
  'produced_quantity' | 'production_status'
> & {
  produced_quantity: number;
  production_status: ProductionStatus;
  recipe_name: string;
};

export type MobileProductionOrderSummary = MobileProductionOrder & {
  total_items: number;
  completed_items: number;
};

export type MobileProductionItemSelection = Pick<
  ProductionOrderItemRow,
  | 'id'
  | 'raw_material_id'
  | 'planned_quantity'
  | 'consumed_quantity'
  | 'status'
>;

export type MobileRawMaterial = Pick<RawMaterialRow, 'id' | 'name'>;

export type MobileProductionItem = MobileProductionItemSelection & {
  raw_material: MobileRawMaterial | null;
};

export type MobileProductionDetail = {
  order: MobileProductionOrder;
  items: MobileProductionItem[];
};

type ProductionItemStatus = Pick<ProductionOrderItemRow, 'status'>;
type GroupedProductionItemStatus = Pick<
  ProductionOrderItemRow,
  'production_order_id' | 'status'
>;

export function normalizeMobileProductionOrder(
  order: MobileProductionOrderSelection,
  recipeName: string | null | undefined,
): MobileProductionOrder {
  return {
    ...order,
    produced_quantity: order.produced_quantity ?? 0,
    production_status: assertProductionStatus(order.production_status),
    recipe_name: recipeName ?? '-',
  };
}

export function normalizeMobileProductionSummary(
  order: MobileProductionOrderSelection,
  recipeName: string | null | undefined,
  items: readonly ProductionItemStatus[],
): MobileProductionOrderSummary {
  return {
    ...normalizeMobileProductionOrder(order, recipeName),
    total_items: items.length,
    completed_items: items.filter((item) => item.status === 'completed').length,
  };
}

export function normalizeMobileProductionItem(
  item: MobileProductionItemSelection,
  rawMaterial: MobileRawMaterial | null | undefined,
): MobileProductionItem {
  return {
    ...item,
    raw_material: rawMaterial ?? null,
  };
}

export function groupProductionItemStatuses(
  items: readonly GroupedProductionItemStatus[],
): Map<string, ProductionItemStatus[]> {
  const groups = new Map<string, ProductionItemStatus[]>();

  for (const item of items) {
    const group = groups.get(item.production_order_id) ?? [];

    group.push({ status: item.status });
    groups.set(item.production_order_id, group);
  }

  return groups;
}

export function uniqueProductionIds(ids: readonly string[]): string[] {
  return Array.from(new Set(ids));
}
