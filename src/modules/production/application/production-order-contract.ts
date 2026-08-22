import type { PublicTableRow } from '@/infrastructure/integrations/supabase/database.types';

import {
  PRODUCTION_STATUS,
  type ProductionStatus,
} from '../domain/constants';

type ProductionOrderRow = PublicTableRow<'production_orders'>;
type RawMaterialLotRow = PublicTableRow<'raw_material_lots'>;
type StockQuantity = {
  quantity: RawMaterialLotRow['quantity'] | null;
};
type ProductionOrderSelection = Pick<
  ProductionOrderRow,
  | 'id'
  | 'recipe_id'
  | 'planned_quantity'
  | 'produced_quantity'
  | 'production_status'
  | 'notes'
>;

export type ProductionOrderState = Omit<
  ProductionOrderSelection,
  'production_status'
> & { production_status: ProductionStatus };

function isProductionStatus(value: unknown): value is ProductionStatus {
  return (
    value === PRODUCTION_STATUS.DRAFT ||
    value === PRODUCTION_STATUS.RELEASED ||
    value === PRODUCTION_STATUS.IN_PROGRESS ||
    value === PRODUCTION_STATUS.COMPLETED ||
    value === PRODUCTION_STATUS.CANCELLED
  );
}

export function assertProductionStatus(value: unknown): ProductionStatus {
  if (!isProductionStatus(value)) {
    throw new Error('Estado de producción fuera del contrato.');
  }

  return value;
}

export function canCancelProductionOrder(status: ProductionStatus): boolean {
  return (
    status === PRODUCTION_STATUS.DRAFT ||
    status === PRODUCTION_STATUS.RELEASED
  );
}

export function toProductionOrderState(
  order: ProductionOrderSelection,
): ProductionOrderState {
  return {
    ...order,
    production_status: assertProductionStatus(order.production_status),
  };
}

export function calculateRequiredQuantity(
  quantityPerUnit: number,
  plannedQuantity: number,
): number {
  return quantityPerUnit * plannedQuantity;
}

export function sumAvailableStock(
  lots: readonly StockQuantity[],
): number {
  return lots.reduce((total, lot) => total + Number(lot.quantity ?? 0), 0);
}
